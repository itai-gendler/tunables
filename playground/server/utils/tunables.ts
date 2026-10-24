import postgres from 'postgres'
import { createTunables, memoryStore, type ScopePath, type TunablesStore } from 'tunables'
import type { AccessTarget } from 'tunables/server'
import { fromPostgresJs, migrate, postgresStore } from 'tunables/postgres'
import { catalogs, effects, groups, presets, scopeLabel, scopes } from '../../../examples/tasklane/tunables'

async function makeTunables() {
  let store: TunablesStore & { reset?: () => void }
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl) {
    const sql = postgres(databaseUrl, { max: 4, onnotice: () => {} })
    const client = fromPostgresJs(sql)
    await migrate(client, { schema: 'playground' })
    store = postgresStore(client, { schema: 'playground' })
  } else {
    store = memoryStore()
  }
  const tunables = createTunables({ store, groups, presets, catalogs, effects, scopes, scopeLabel })
  await seed(tunables)
  return { tunables, store }
}

/** Seed the defaults, and put Acme on the Pro plan; Hobby club stays on the default plan. */
async function seed(tunables: Awaited<ReturnType<typeof makeTunables>>['tunables']) {
  await tunables.sync({ actor: 'playground' })
  const plans = tunables.presets('plans')
  if (!(await plans.assignments('acme')).length) await plans.assign('acme', 'plan', 'pro', { actor: 'playground' })
}

let made: ReturnType<typeof makeTunables> | undefined
/** The playground's tunables, set up and seeded on first use: boot never needs the database. */
export function usePlaygroundTunables() {
  made ??= makeTunables()
  return made
}

/** Empty the memory store and seed it again, for tests that need a known start. */
export async function resetPlayground() {
  const { tunables, store } = await usePlaygroundTunables()
  if (!store.reset) throw createError({ statusCode: 409, message: 'Only the memory store can be reset.' })
  store.reset()
  await seed(tunables)
}

/**
 * Who the playground says is signed in, from its cookie: Sam on Tasklane's
 * staff, Olivia who owns the Acme workspace, or Dana, a member of Acme.
 */
export type Who = 'staff' | 'owner' | 'member'
export interface PlaygroundContext { who: Who }

const people: Record<Who, { id: string, name: string }> = {
  staff: { id: 'sam', name: 'Sam' },
  owner: { id: 'olivia', name: 'Olivia' },
  member: { id: 'dana', name: 'Dana' }
}

/** The one scope each person may change: their workspace, or their own settings in it. */
function ownScope(who: Who, scope: ScopePath | undefined): boolean {
  if (who === 'owner') return scope?.workspace === 'acme' && !scope.user
  if (who === 'member') return scope?.workspace === 'acme' && scope.user === 'dana'
  return false
}

export const access = {
  actor: (context: PlaygroundContext) => people[context.who],
  authorize: (context: PlaygroundContext, request: { target: AccessTarget }) => {
    if (context.who === 'staff') return true
    // Everyone signed in reads the description, so their own settings screen can show.
    if (request.target.kind === 'description') return true
    return request.target.kind === 'group' && ownScope(context.who, request.target.scope)
  }
}

export function playgroundContext(cookie: string | undefined): PlaygroundContext {
  return { who: cookie === 'owner' || cookie === 'member' ? cookie : 'staff' }
}
