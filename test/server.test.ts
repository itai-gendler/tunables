import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import express from 'express'
import { createRouterClient } from '@orpc/server'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTunables, memoryStore } from '../src/index.js'
import { createHandler } from '../src/server/index.js'
import { tunablesMiddleware } from '../src/server/express.js'
import { tunablesRouter } from '../src/server/orpc.js'
import { fetchClient, orpcClient, TunablesClientError, type TunablesClient } from '../src/client/index.js'
import { catalogs, effects, feedsAbove, groups, presets, units } from './fixtures/news/news.js'

/** Who the test request says it is: an administrator, a reader, or nobody. */
type Who = 'admin' | 'reader' | 'nobody'
interface Context { who: Who }

const access = {
  actor: (context: Context) => context.who === 'nobody' ? undefined : { id: context.who, name: context.who === 'admin' ? 'Ada Admin' : 'Rae Reader' },
  authorize: (context: Context, request: { action: 'read' | 'change' }) => context.who === 'admin' || (context.who === 'reader' && request.action === 'read' && false)
}

function makeTunables() {
  return createTunables({ store: memoryStore(), groups, presets, catalogs, effects, units, guards: { collection: [feedsAbove(() => [{ name: 'Ars', maxArticles: 30, lookbackDays: 7, official: true }])] } })
}

let tunables: ReturnType<typeof makeTunables>
beforeEach(async () => {
  tunables = makeTunables()
  await tunables.sync()
})

/** A fetch that answers from the handler directly, as a server would. */
function viaHandler(who: Who, options: { refusal?: 'not-found' | 'forbidden' } = {}): typeof fetch {
  const handle = createHandler<Context>({ tunables, ...access, ...options })
  return async (input, init) => {
    const request = new Request(new URL(String(input), 'http://app.test'), init)
    return (await handle(request, { who })) ?? new Response('host route', { status: 299 })
  }
}

/** The same operations, checked through every client. */
function clientSuite(name: string, make: (who: Who) => TunablesClient) {
  describe(`${name}`, () => {
    it('describes the definitions and reads every group', async () => {
      const client = make('admin')
      expect((await client.describe()).groups.map(group => group.id)).toEqual(['collection', 'run', 'readers'])
      expect((await client.overview()).map(entry => entry.group)).toEqual(['collection', 'run', 'readers'])
      expect((await client.group('run')).display.values.budgetLimitUsd).toBe('$25')
    })

    it('saves as the signed-in actor, and answers a refused change with its problems', async () => {
      const client = make('admin')
      const saved = await client.save('readers', { values: { briefsPerReader: 6 }, reason: 'More' })
      expect(saved.revision).toMatchObject({ actor: 'Ada Admin', reason: 'More' })
      const refused = await client.save('collection', { values: { maxArticlesPerRetrieval: 20, newFeedMaxArticles: 10 } })
      expect(refused).toMatchObject({ saved: false, problems: [{ message: 'Feed "Ars" reads 30 articles, above the Most articles per retrieval of 20.' }] })
      const asked = await client.save('run', { values: { screeningReasonWords: 30 } })
      expect(asked.confirm).toBeTruthy()
      expect((await client.save('run', { values: { screeningReasonWords: 30 }, confirmed: true })).saved).toBe(true)
    })

    it('reads history and restores a revision', async () => {
      const client = make('admin')
      const first = await client.save('readers', { values: { briefsPerReader: 7 } })
      await client.save('readers', { values: { briefsPerReader: 3 } })
      const history = await client.history({ kind: 'group', name: 'readers', limit: 2 })
      expect(history.map(revision => revision.changes[0]?.to)).toEqual([3, 7])
      expect((await client.history({ kind: 'group', name: 'readers', before: history[1]!.id }))[0]!.reason).toBe('Seeded with the defaults.')
      const restored = await client.restore({ revision: first.revision!.id, reason: 'Back' })
      expect(restored.value?.values.briefsPerReader).toBe(7)
      expect((await client.reset('readers', { keys: ['briefsPerReader'] })).value?.values.briefsPerReader).toBe(12)
    })

    it('manages presets and assignments', async () => {
      const client = make('admin')
      const created = await client.createPreset('run-configs', { key: 'light', slot: 'daily', label: 'Light', values: { maxBudgetUsd: 0.05 } })
      expect(created.saved).toBe(true)
      await client.assign('run-configs', 'reader-1', 'daily', { key: 'light' })
      expect((await client.presets('run-configs')).find(preset => preset.key === 'light')?.assigned).toBe(1)
      expect(await client.assignments('run-configs', 'reader-1')).toEqual([{ collection: 'preset:run-configs', subject: 'reader-1', slot: 'daily', recordId: 'light' }])
      expect((await client.updatePreset('run-configs', 'light', { values: { maxTurns: 999 } })).problems[0]!.message).toMatch(/Turns limit/)
      expect((await client.makeDefault('run-configs', 'light')).saved).toBe(true)
      expect((await client.removePreset('run-configs', 'daily')).saved).toBe(true)
    })

    it('manages a catalog whose entry ids hold slashes', async () => {
      const client = make('admin')
      const entries = await client.catalog('models')
      expect(entries.find(entry => entry.id === 'openai/gpt-oss-120b')?.usedBy).toEqual(['Run Config "Daily brief"', 'Run Config "Weekly brief"'])
      expect((await client.addEntry('models', { id: 'qwen/qwen3-32b', values: { label: 'Qwen3', efforts: ['medium'] } })).saved).toBe(true)
      expect((await client.editEntry('models', 'qwen/qwen3-32b', { values: { note: 'Fast' } })).value?.values.note).toBe('Fast')
      expect((await client.retire('models', 'qwen/qwen3-32b')).value?.state).toBe('retired')
      expect((await client.reinstate('models', 'qwen/qwen3-32b')).value?.state).toBe('available')
      expect((await client.retire('models', 'openai/gpt-oss-120b')).problems[0]!.message).toMatch(/in use by/)
    })

    it('refuses whoever the host does not allow, as not found', async () => {
      await expect(make('reader').group('run')).rejects.toMatchObject({ status: 404 })
      await expect(make('nobody').save('readers', { values: { briefsPerReader: 1 } })).rejects.toMatchObject({ status: 404 })
      await expect(make('admin').group('moon')).rejects.toMatchObject({ status: 404, message: 'No group "moon".' })
      await expect(make('admin').presets('moon')).rejects.toBeInstanceOf(TunablesClientError)
    })
  })
}

clientSuite('fetch handler through fetchClient', who => fetchClient({ fetch: viaHandler(who) }))

clientSuite('oRPC router through orpcClient', (who) => {
  const router = tunablesRouter<Context>({ tunables, ...access })
  return orpcClient(createRouterClient(router, { context: { who } }) as never)
})

describe('fetch handler', () => {
  it('answers only under its base path, and leaves the rest to the host', async () => {
    const handle = createHandler<Context>({ tunables, ...access })
    expect(await handle(new Request('http://app.test/api/other'), { who: 'admin' })).toBeUndefined()
    expect((await handle(new Request('http://app.test/api/tunables/nothing'), { who: 'admin' }))?.status).toBe(404)
    expect((await handle(new Request('http://app.test/api/tunables/describe', { method: 'POST' }), { who: 'admin' }))?.status).toBe(405)
    const bad = await handle(new Request('http://app.test/api/tunables/groups/run', { method: 'PUT', body: '{' }), { who: 'admin' })
    expect(bad?.status).toBe(400)
    const wrong = await handle(new Request('http://app.test/api/tunables/groups/run', { method: 'PUT', body: JSON.stringify({ value: 1 }) }), { who: 'admin' })
    expect(await wrong?.json()).toEqual({ error: 'values: Invalid input: expected record, received undefined' })
  })

  it('answers refusals as forbidden when the host prefers', async () => {
    const reader = fetchClient({ fetch: viaHandler('reader', { refusal: 'forbidden' }) })
    await expect(reader.group('run')).rejects.toMatchObject({ status: 403 })
    const nobody = fetchClient({ fetch: viaHandler('nobody', { refusal: 'forbidden' }) })
    await expect(nobody.group('run')).rejects.toMatchObject({ status: 401 })
  })

  it('refuses everything when the host says nothing about access', async () => {
    const handle = createHandler<Context>({ tunables, actor: () => 'someone' })
    expect((await handle(new Request('http://app.test/api/tunables/groups'), { who: 'admin' }))?.status).toBe(404)
  })
})

describe('access before anything else', () => {
  it('says nothing about paths, methods or bodies to someone not allowed in', async () => {
    const handle = createHandler<Context>({ tunables, ...access })
    const nobody = { who: 'nobody' as const }
    const answers = await Promise.all([
      handle(new Request('http://app.test/api/tunables/describe', { method: 'POST' }), nobody),
      handle(new Request('http://app.test/api/tunables/groups/run', { method: 'PUT', body: '{}' }), nobody),
      handle(new Request('http://app.test/api/tunables/groups/run', { method: 'PUT', body: '{' }), nobody),
      handle(new Request('http://app.test/api/tunables/history?kind=group&name=moon'), nobody),
      handle(new Request('http://app.test/api/tunables/nothing'), nobody),
      handle(new Request('http://app.test/api/tunables/restore', { method: 'POST', body: '{"revision":"1"}' }), nobody)
    ])
    for (const answer of answers) {
      expect(answer?.status).toBe(404)
      expect(await answer?.json()).toEqual({ error: 'Not found.' })
    }
  })

  it('lists on All settings only the groups the host lets someone read', async () => {
    const client = fetchClient({ fetch: async (input, init) => (await createHandler<Context>({
      tunables,
      actor: () => 'support',
      authorize: (_context, request) => request.action === 'read' && request.target.id !== 'run'
    })(new Request(new URL(String(input), 'http://app.test'), init), { who: 'reader' }))! })
    expect((await client.overview()).map(entry => entry.group)).toEqual(['collection', 'readers'])
  })
})

describe('Express middleware', () => {
  let server: ReturnType<typeof createServer>
  let base: string
  beforeAll(async () => {
    const app = express()
    app.use(express.json())
    app.use((req, _res, next) => {
      (req as unknown as { who: Who }).who = (req.headers['x-who'] as Who | undefined) ?? 'nobody'
      next()
    })
    app.use(tunablesMiddleware({
      tunables: new Proxy({}, { get: (_target, key) => (tunables as never)[key] }) as never,
      actor: req => (req as unknown as Context).who === 'admin' ? { id: 'admin', name: 'Ada Admin' } : undefined,
      authorize: req => (req as unknown as Context).who === 'admin'
    }))
    app.get('/api/health', (_req, res) => { res.json({ ok: true }) })
    server = createServer(app)
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })
  afterAll(() => new Promise<void>(resolve => server.close(() => resolve())))

  it('serves the API under its path and passes the rest on', async () => {
    const client = fetchClient({ baseURL: `${base}/api/tunables`, headers: { 'x-who': 'admin' } })
    expect((await client.save('readers', { values: { briefsPerReader: 4 } })).revision?.actor).toBe('Ada Admin')
    expect(await (await fetch(`${base}/api/health`)).json()).toEqual({ ok: true })
    await expect(fetchClient({ baseURL: `${base}/api/tunables` }).overview()).rejects.toMatchObject({ status: 404 })
  })
})
