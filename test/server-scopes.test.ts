import { createRouterClient } from '@orpc/server'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTunables, memoryStore, type ScopePath } from '../src/index.js'
import { createHandler, type AccessTarget } from '../src/server/index.js'
import { tunablesRouter } from '../src/server/orpc.js'
import { fetchClient, orpcClient, type TunablesClient } from '../src/client/index.js'
import { catalogs, effects, groups, presets, scopeLabel, scopes } from '../examples/tasklane/tunables.js'

/**
 * Who may change which scope is the host's to say: Tasklane's staff change
 * anything, a workspace owner their workspace, and each person only their own
 * settings. Rule `the-host-decides-who-changes-each-scope`.
 */
type Who = 'staff' | 'owner' | 'dana' | 'stranger'
interface Context { who: Who }
const asked: AccessTarget[] = []

const mine = (who: Who, scope: ScopePath | undefined) => {
  if (who === 'owner') return scope?.workspace === 'acme' && !scope.user
  if (who === 'dana') return scope?.workspace === 'acme' && scope.user === 'dana'
  return false
}
const access = {
  actor: (context: Context) => context.who === 'stranger' ? undefined : { id: context.who, name: context.who },
  authorize: (context: Context, request: { action: 'read' | 'change', target: AccessTarget }) => {
    asked.push(request.target)
    if (context.who === 'staff') return true
    if (request.target.kind === 'description') return true
    return request.target.kind === 'group' && mine(context.who, request.target.scope)
  }
}

let tunables: ReturnType<typeof makeTunables>
function makeTunables() {
  return createTunables({ store: memoryStore(), groups, presets, catalogs, effects, scopes, scopeLabel })
}
beforeEach(async () => {
  asked.length = 0
  tunables = makeTunables()
  await tunables.sync()
  await tunables.presets('plans').assign('acme', 'plan', 'pro')
})

function viaHandler(who: Who): typeof fetch {
  const handle = createHandler<Context>({ tunables, ...access })
  return async (input, init) => (await handle(new Request(new URL(String(input), 'http://app.test'), init), { who }))!
}

function suite(name: string, make: (who: Who) => TunablesClient) {
  describe(name, () => {
    it('lets a workspace owner read and change their workspace, and nothing broader', async () => {
      const owner = make('owner')
      const entry = await owner.group('limits', { workspace: 'acme' })
      expect(entry.scope?.label).toBe('Acme')
      expect(entry.layers?.maxProjects).toMatchObject({ inherited: 50, fromLabel: 'Pro plan' })
      expect(asked.at(-1)).toEqual({ kind: 'group', id: 'limits', scope: { workspace: 'acme' } })

      const saved = await owner.save('limits', { values: { maxProjects: 10 }, scope: { workspace: 'acme' }, reason: 'Keep it small' })
      expect(saved.saved).toBe(true)
      expect(saved.value?.values.maxProjects).toBe(10)
      const above = await owner.save('limits', { values: { maxProjects: 80 }, scope: { workspace: 'acme' } })
      expect(above.problems[0]?.message).toBe('Projects may be at most 50 for Acme, the value it inherits.')

      await expect(owner.group('limits')).rejects.toMatchObject({ status: 404 })
      await expect(owner.save('limits', { values: { maxProjects: 1 } })).rejects.toMatchObject({ status: 404 })
      await expect(owner.group('limits', { workspace: 'hobby' })).rejects.toMatchObject({ status: 404 })
    })

    it('lets a person set and clear their own values, and use the inherited one again', async () => {
      const dana = make('dana')
      const path = { workspace: 'acme', user: 'dana' }
      expect((await dana.save('workspace', { values: { reminderHour: 7 }, scope: path })).saved).toBe(true)
      const cleared = await dana.save('workspace', { values: { reminderHour: null }, scope: path })
      expect(cleared.value?.layers?.reminderHour?.overridden).toBe(false)
      expect((await dana.reset('workspace', { scope: path })).saved).toBe(true)
      const history = await dana.history({ kind: 'group', name: 'workspace', id: 'workspace=acme;user=dana' })
      expect(history.length).toBe(2)
      await expect(dana.group('workspace', { workspace: 'acme', user: 'lee' })).rejects.toMatchObject({ status: 404 })
      await expect(dana.save('workspace', { values: { reminderHour: 7 }, scope: { workspace: 'acme' } })).rejects.toMatchObject({ status: 404 })
    })

    it('refuses an invalid path only to someone allowed in', async () => {
      await expect(make('staff').group('workspace', { user: 'dana' })).rejects.toMatchObject({ status: 400 })
      await expect(make('dana').group('workspace', { user: 'dana' })).rejects.toMatchObject({ status: 400 })
      await expect(make('stranger').group('workspace', { user: 'dana' })).rejects.toMatchObject({ status: 404 })
      expect(asked.some(target => target.scope?.user && !target.scope.workspace)).toBe(false)
    })
  })
}

suite('fetch handler through fetchClient', who => fetchClient({ fetch: viaHandler(who) }))
suite('oRPC router through orpcClient', who => orpcClient(createRouterClient(tunablesRouter<Context>({ tunables, ...access }), { context: { who } }) as never))
