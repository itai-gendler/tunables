import { TunablesError } from '../engine/tunables.js'
import { createService, ServiceError, type ServiceOptions, type TunablesService } from './service.js'

/**
 * tunables' HTTP API as one function from a web-standard Request to a Response,
 * so it mounts in any server that speaks them: Nitro and h3, Hono, Bun, Deno,
 * Cloudflare Workers. It answers only paths under its base path and returns
 * `undefined` for the rest, so the host's own routes go on as before.
 */

export interface HandlerOptions<Context> extends ServiceOptions<Context> {
  /** Where the API is mounted. Defaults to "/api/tunables". */
  basePath?: string
}

type Route<Context> = {
  method: string
  pattern: string[]
  run: (service: TunablesService<Context>, context: Context, params: Record<string, string>, body: unknown, query: URLSearchParams) => Promise<unknown>
}

const route = <Context>(method: string, path: string, run: Route<Context>['run']): Route<Context> => ({ method, pattern: path.split('/').filter(Boolean), run })

function routes<Context>(): Route<Context>[] {
  return [
    route('GET', 'describe', (s, c) => s.describe(c)),
    route('GET', 'groups', (s, c) => s.overview(c)),
    route('GET', 'groups/:id', (s, c, p) => s.group(c, p.id!)),
    route('PUT', 'groups/:id', (s, c, p, b) => s.save(c, p.id!, b)),
    route('POST', 'groups/:id/reset', (s, c, p, b) => s.reset(c, p.id!, b)),
    route('GET', 'history', (s, c, _p, _b, q) => s.history(c, Object.fromEntries(q))),
    route('POST', 'restore', (s, c, _p, b) => s.restore(c, b)),
    route('GET', 'presets/:set', (s, c, p) => s.presets(c, p.set!)),
    route('POST', 'presets/:set', (s, c, p, b) => s.createPreset(c, p.set!, b)),
    route('GET', 'presets/:set/assignments', (s, c, p, _b, q) => s.assignments(c, p.set!, q.get('subject') ?? undefined)),
    route('PUT', 'presets/:set/assignments/:subject/:slot', (s, c, p, b) => s.assign(c, p.set!, p.subject!, p.slot!, b)),
    route('PUT', 'presets/:set/:key', (s, c, p, b) => s.updatePreset(c, p.set!, p.key!, b)),
    route('DELETE', 'presets/:set/:key', (s, c, p, b) => s.removePreset(c, p.set!, p.key!, b)),
    route('POST', 'presets/:set/:key/default', (s, c, p, b) => s.makeDefault(c, p.set!, p.key!, b)),
    route('GET', 'catalogs/:id', (s, c, p) => s.catalog(c, p.id!)),
    route('POST', 'catalogs/:id', (s, c, p, b) => s.addEntry(c, p.id!, b)),
    route('PUT', 'catalogs/:id/:entry', (s, c, p, b) => s.editEntry(c, p.id!, p.entry!, b)),
    route('POST', 'catalogs/:id/:entry/retire', (s, c, p, b) => s.retire(c, p.id!, p.entry!, b)),
    route('POST', 'catalogs/:id/:entry/reinstate', (s, c, p, b) => s.reinstate(c, p.id!, p.entry!, b))
  ]
}

function match(pattern: string[], segments: string[]): Record<string, string> | undefined {
  if (pattern.length !== segments.length) return undefined
  const params: Record<string, string> = {}
  for (const [index, part] of pattern.entries()) {
    const segment = segments[index]!
    if (part.startsWith(':')) params[part.slice(1)] = segment
    else if (part !== segment) return undefined
  }
  return params
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
})

/** The status and body an error answers with: the service's own, or a 500 that names nothing internal. */
export function errorResponse(error: unknown): { status: number, body: { error: string } } {
  if (error instanceof ServiceError) return { status: error.status, body: { error: error.message } }
  if (error instanceof TunablesError) return { status: 409, body: { error: error.message } }
  return { status: 500, body: { error: 'Something went wrong on the server.' } }
}

/**
 * The handler. Give it how to find the actor and whether they may act; call it
 * with each request and its context (your session, your database), and return
 * its Response when it gives one.
 */
export function createHandler<Context = Request>(options: HandlerOptions<Context>) {
  const service = createService(options)
  const base = (options.basePath ?? '/api/tunables').replace(/\/+$/, '').split('/').filter(Boolean)
  const table = routes<Context>()

  return async function handle(request: Request, context: Context = request as unknown as Context): Promise<Response | undefined> {
    const url = new URL(request.url)
    let segments: string[]
    try {
      segments = url.pathname.split('/').filter(Boolean).map(segment => decodeURIComponent(segment))
    } catch {
      return json(400, { error: 'The path is not valid.' })
    }
    if (base.some((part, index) => segments[index] !== part)) return undefined
    const rest = segments.slice(base.length)
    let methodAllowed = false
    for (const candidate of table) {
      const params = match(candidate.pattern, rest)
      if (!params) continue
      methodAllowed = true
      if (candidate.method !== request.method) continue
      let body: unknown
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        const text = await request.text()
        if (text) {
          try {
            body = JSON.parse(text)
          } catch {
            return json(400, { error: 'The body is not JSON.' })
          }
        }
      }
      try {
        return json(200, await candidate.run(service, context, params, body, url.searchParams))
      } catch (error) {
        const { status, body: answer } = errorResponse(error)
        if (status === 500) console.error('tunables:', error)
        return json(status, answer)
      }
    }
    return methodAllowed ? json(405, { error: `${request.method} is not allowed here.` }) : json(404, { error: 'Not found.' })
  }
}

export { createService, ServiceError }
export type { ServiceOptions, TunablesService, Action, AccessTarget } from './service.js'
