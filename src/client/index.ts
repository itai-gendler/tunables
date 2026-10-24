import type { Description } from '../engine/describe.js'
import type { GroupEntry, Outcome } from '../engine/tunables.js'
import type { Assignment, Revision, RevisionTarget } from '../engine/store.js'
import type { CatalogEntry, Preset } from '../model/definitions.js'
import type { ScopePath } from '../engine/scopes.js'

/**
 * What the screens call, whichever way the host serves tunables: the fetch API
 * (`fetchClient`) or an oRPC router (`orpcClient`). The answers are plain JSON.
 */

export interface PresetSummary extends Preset {
  /** How many subjects are assigned this preset. */
  assigned: number
}

export interface CatalogEntrySummary extends CatalogEntry {
  /** Names of what uses the entry; while any do, it cannot be retired. */
  usedBy: string[]
}

export interface ChangeInput {
  reason?: string
}

export interface TunablesClient {
  describe(): Promise<Description>
  overview(): Promise<GroupEntry[]>
  /** A group's entry: the system's, or as read at a scope path. */
  group(id: string, scope?: ScopePath): Promise<GroupEntry>
  /** Save values, at a scope when given; `null` uses the inherited value there again. */
  save(id: string, input: { values: Record<string, unknown>, confirmed?: boolean, scope?: ScopePath } & ChangeInput): Promise<Outcome<GroupEntry>>
  reset(id: string, input?: { keys?: string[], scope?: ScopePath } & ChangeInput): Promise<Outcome<GroupEntry>>
  history(target: RevisionTarget & { limit?: number, before?: string }): Promise<Revision[]>
  restore(input: { revision: string, confirmed?: boolean } & ChangeInput): Promise<Outcome<GroupEntry>>
  presets(set: string): Promise<PresetSummary[]>
  createPreset(set: string, input: { key: string, slot: string, label: string, values?: Record<string, unknown> } & ChangeInput): Promise<Outcome<Preset>>
  updatePreset(set: string, key: string, input: { label?: string, values?: Record<string, unknown> } & ChangeInput): Promise<Outcome<Preset>>
  removePreset(set: string, key: string, input?: ChangeInput): Promise<Outcome>
  makeDefault(set: string, key: string, input?: ChangeInput): Promise<Outcome>
  assignments(set: string, subject?: string): Promise<Assignment[]>
  assign(set: string, subject: string, slot: string, input: { key: string | null } & ChangeInput): Promise<Outcome>
  catalog(id: string): Promise<CatalogEntrySummary[]>
  addEntry(id: string, input: { id: string, values: Record<string, unknown> } & ChangeInput): Promise<Outcome<CatalogEntry>>
  editEntry(id: string, entry: string, input: { values: Record<string, unknown> } & ChangeInput): Promise<Outcome<CatalogEntry>>
  retire(id: string, entry: string, input?: ChangeInput): Promise<Outcome<CatalogEntry>>
  reinstate(id: string, entry: string, input?: ChangeInput): Promise<Outcome<CatalogEntry>>
}

/** A request the server refused or could not answer. A refused change is not one: it comes back with `problems`. */
export class TunablesClientError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
    this.name = 'TunablesClientError'
  }
}

export interface FetchClientOptions {
  /** Where the API is mounted. Defaults to "/api/tunables". */
  baseURL?: string
  fetch?: typeof globalThis.fetch
  /** Extra headers for every request, such as a CSRF token. */
  headers?: Record<string, string> | (() => Record<string, string>)
  credentials?: RequestCredentials
}

const part = (value: string) => encodeURIComponent(value)
const scopeQuery = (scope?: ScopePath) => scope && Object.keys(scope).length
  ? `?scope=${encodeURIComponent(Object.entries(scope).map(([name, id]) => `${name}=${id}`).join(';'))}`
  : ''

export function fetchClient(options: FetchClientOptions = {}): TunablesClient {
  const base = (options.baseURL ?? '/api/tunables').replace(/\/+$/, '')
  const send = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    const doFetch = options.fetch ?? globalThis.fetch
    const extra = typeof options.headers === 'function' ? options.headers() : options.headers
    const response = await doFetch(`${base}/${path}`, {
      method,
      credentials: options.credentials ?? 'same-origin',
      headers: { accept: 'application/json', ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...extra },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
    const text = await response.text()
    let parsed: unknown
    try {
      parsed = text ? JSON.parse(text) : undefined
    } catch {
      throw new TunablesClientError(response.status, `The server answered ${response.status} with something that is not JSON.`)
    }
    if (!response.ok) throw new TunablesClientError(response.status, (parsed as { error?: string } | undefined)?.error ?? `The server answered ${response.status}.`)
    return parsed as T
  }
  return {
    describe: () => send('GET', 'describe'),
    overview: () => send('GET', 'groups'),
    group: (id, scope) => send('GET', `groups/${part(id)}${scopeQuery(scope)}`),
    save: (id, input) => send('PUT', `groups/${part(id)}`, input),
    reset: (id, input = {}) => send('POST', `groups/${part(id)}/reset`, input),
    history: (target) => {
      const query = new URLSearchParams({ kind: target.kind, name: target.name })
      if (target.id) query.set('id', target.id)
      if (target.limit) query.set('limit', String(target.limit))
      if (target.before) query.set('before', target.before)
      return send('GET', `history?${query}`)
    },
    restore: input => send('POST', 'restore', input),
    presets: set => send('GET', `presets/${part(set)}`),
    createPreset: (set, input) => send('POST', `presets/${part(set)}`, input),
    updatePreset: (set, key, input) => send('PUT', `presets/${part(set)}/${part(key)}`, input),
    removePreset: (set, key, input = {}) => send('DELETE', `presets/${part(set)}/${part(key)}`, input),
    makeDefault: (set, key, input = {}) => send('POST', `presets/${part(set)}/${part(key)}/default`, input),
    assignments: (set, subject) => send('GET', `presets/${part(set)}/assignments${subject ? `?subject=${part(subject)}` : ''}`),
    assign: (set, subject, slot, input) => send('PUT', `presets/${part(set)}/assignments/${part(subject)}/${part(slot)}`, input),
    catalog: id => send('GET', `catalogs/${part(id)}`),
    addEntry: (id, input) => send('POST', `catalogs/${part(id)}`, input),
    editEntry: (id, entry, input) => send('PUT', `catalogs/${part(id)}/${part(entry)}`, input),
    retire: (id, entry, input = {}) => send('POST', `catalogs/${part(id)}/${part(entry)}/retire`, input),
    reinstate: (id, entry, input = {}) => send('POST', `catalogs/${part(id)}/${part(entry)}/reinstate`, input)
  }
}

/** The procedures `tunablesRouter` serves, as an oRPC client sees them. */
interface ProcedureClients {
  [name: string]: (input?: any) => Promise<any>
}

/**
 * The screens' client over the host's oRPC client: pass the `tunables` branch
 * of it, such as `orpcClient(client.tunables)`.
 */
export function orpcClient(procedures: ProcedureClients): TunablesClient {
  const call = async <T>(name: string, input?: unknown): Promise<T> => {
    try {
      return await procedures[name]!(input) as T
    } catch (error) {
      const failure = error as { status?: number, message?: string }
      throw new TunablesClientError(failure.status ?? 500, failure.message ?? 'The request failed.')
    }
  }
  return {
    describe: () => call('describe'),
    overview: () => call('overview'),
    group: (id, scope) => call('group', { id, scope }),
    save: (id, input) => call('save', { id, ...input }),
    reset: (id, input = {}) => call('reset', { id, ...input }),
    history: target => call('history', target),
    restore: input => call('restore', input),
    presets: set => call('presets', { set }),
    createPreset: (set, input) => call('createPreset', { set, ...input }),
    updatePreset: (set, key, input) => call('updatePreset', { set, key, ...input }),
    removePreset: (set, key, input = {}) => call('removePreset', { set, key, ...input }),
    makeDefault: (set, key, input = {}) => call('makeDefault', { set, key, ...input }),
    assignments: (set, subject) => call('assignments', { set, subject }),
    assign: (set, subject, slot, input) => call('assign', { set, subject, slot, ...input }),
    catalog: id => call('catalog', { id }),
    addEntry: (catalog, input) => call('addEntry', { catalog, ...input }),
    editEntry: (id, entry, input) => call('editEntry', { id, entry, ...input }),
    retire: (id, entry, input = {}) => call('retire', { id, entry, ...input }),
    reinstate: (id, entry, input = {}) => call('reinstate', { id, entry, ...input })
  }
}

export type { Description, GroupEntry, Outcome, Revision, RevisionTarget, Assignment, CatalogEntry, Preset }
export type { FieldDescription, GroupDescription, PresetsDescription, CatalogDescription } from '../engine/describe.js'
export { displayValue } from './format.js'
export type { Problem } from '../model/definitions.js'
export type { ScopePath } from '../engine/scopes.js'
export type { FieldLayer } from '../engine/tunables.js'
