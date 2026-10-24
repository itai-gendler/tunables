import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTunables, memoryStore } from '../src/index.js'
import { createHandler } from '../src/server/index.js'
import { catalogs, effects, groups, presets, scopeLabel, scopes } from '../examples/tasklane/tunables.js'
import { tunables as cli } from './cli-support.js'

/** The value commands against a running app's API: its own access policy and actor apply. */
let server: Server
let url: string
const tunables = createTunables({ store: memoryStore(), groups, presets, catalogs, effects, scopes, scopeLabel })

beforeAll(async () => {
  await tunables.sync()
  const handle = createHandler<Request>({
    tunables,
    actor: request => request.headers.get('authorization') === 'Bearer staff-token' ? { id: 'ci', name: 'Deploy bot' } : undefined,
    authorize: () => true
  })
  server = createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    const headers = new Headers()
    for (const [name, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(name, value)
    const response = await handle(new Request(`http://localhost${req.url}`, { method: req.method, headers, body: body || undefined }), undefined as never)
      .catch(() => undefined)
    const answer = response ?? new Response('{"error":"Not found."}', { status: 404 })
    res.writeHead(answer.status, Object.fromEntries(answer.headers))
    res.end(Buffer.from(await answer.arrayBuffer()))
  })
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/tunables`
})
afterAll(() => new Promise<void>(done => server.close(() => done())))

describe('value commands over HTTP', () => {
  const run = (token: string | undefined, ...args: string[]) => cli(['--cwd', 'test', ...args, '--url', url], { env: { TUNABLES_TOKEN: token } })

  it('reads, changes at a scope and lists history as the app\'s own actor, with no config file', async () => {
    expect((await run('staff-token', 'get', 'limits', 'maxProjects')).stdout).toContain('maxProjects  3')
    const saved = await run('staff-token', 'set', 'limits', 'aiSuggestionsPerDay=2', '--scope', 'workspace=acme', '--reason', 'Quieter')
    expect(saved.stdout).toMatch(/Saved as revision \d+/)
    const refused = await run('staff-token', 'set', 'limits', 'aiSuggestionsPerDay=9', '--scope', 'workspace=acme', '--reason', 'More')
    expect(refused.code).toBe(1)
    expect(refused.stderr).toContain('AI suggestions a day may be at most 5 for Acme, the value it inherits.')
    const history = JSON.parse((await run('staff-token', 'history', 'limits', '--scope', 'workspace=acme', '--json')).stdout)
    expect(history[0]).toMatchObject({ actor: 'Deploy bot', reason: 'Quieter' })
    expect((await tunables.get('limits', { scope: { workspace: 'acme' } })).aiSuggestionsPerDay).toBe(2)
  })

  it('says a refused token may be the cause', async () => {
    const refused = await run('wrong', 'get', 'limits')
    expect(refused.code).toBe(1)
    expect(refused.stderr).toContain('answered 404')
    expect(refused.stderr).toContain('TUNABLES_TOKEN is one the app allows')
  })
})
