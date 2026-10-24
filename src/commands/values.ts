import { confirm as ask, isCancel } from '@clack/prompts'
import type { GroupEntry, Outcome, SyncReport } from '../engine/tunables.js'
import type { Revision, RevisionTarget } from '../engine/store.js'
import { fetchClient, TunablesClientError } from '../client/index.js'
import { UsageError } from '../core/usage-error.js'
import { configAt, connected, parseValue, terminalActor, type ConfigOptions } from './shared.js'
import { scopeKey, scopeEntries, type ScopePath } from '../engine/scopes.js'

/** `workspace=w1,user=u7` as a scope path; the engine checks it against the chain. */
export function parseScope(text: string | undefined): ScopePath | undefined {
  if (!text?.trim()) return undefined
  const path: Record<string, string> = {}
  for (const part of text.split(',')) {
    const at = part.indexOf('=')
    if (at < 1) throw new UsageError(`"${part}" is not scope=id. Name a scope path as workspace=w1,user=u7.`)
    path[part.slice(0, at).trim()] = part.slice(at + 1).trim()
  }
  return path
}

function printOutcome(outcome: Outcome<unknown>): number {
  if (outcome.saved) {
    console.log(outcome.revision ? `Saved as revision ${outcome.revision.id}.` : 'Nothing changed.')
    return 0
  }
  for (const problem of outcome.problems) console.error(`✗ ${problem.message}`)
  return 1
}

/** Seed new settings with their defaults and report what no definition declares any more. */
export async function runSync(cwd: string, options: ConfigOptions = {}): Promise<number> {
  const { config } = await configAt(cwd, options)
  const report: SyncReport = await connected(config, tunables => tunables.sync({ actor: terminalActor() }))
  const lines = [
    ...report.seeded.map(group => `seeded ${group} with its defaults`),
    ...report.added.map(item => `added ${item.group}.${item.key} with its default`),
    ...report.presets.map(item => `created ${item.key} in ${item.set}${item.isDefault ? `, the ${item.slot} default` : ''}`),
    ...report.catalog.map(item => `added ${item.id} to ${item.catalog}`)
  ]
  console.log(lines.length ? lines.map(line => `✓ ${line}`).join('\n') : 'Everything is in place.')
  for (const item of report.unknown) console.log(`! ${item.group}.${item.key} is stored but no definition declares it; it was kept.`)
  return 0
}

/**
 * Where the value commands read and change values: the app's own store through
 * `tunables.config.ts`, or, given `--url` or `TUNABLES_URL`, the app's HTTP API
 * with `TUNABLES_TOKEN` as a bearer token, so the app's own access policy and
 * actor apply. spec/handlers.md is the API's contract.
 */
interface Backend {
  scopes(): Promise<readonly string[]>
  entry(group: string, scope?: ScopePath): Promise<GroupEntry>
  save(group: string, values: Record<string, unknown>, change: { reason?: string, confirmed?: boolean, scope?: ScopePath }): Promise<Outcome<GroupEntry>>
  history(target: RevisionTarget, limit: number): Promise<Revision[]>
  restore(revision: string, change: { reason?: string, confirmed?: boolean }): Promise<Outcome<GroupEntry>>
}

export interface ValueOptions extends ConfigOptions {
  /** The app's tunables API, such as https://app.example.com/api/tunables. */
  url?: string
}

async function withBackend(cwd: string, options: ValueOptions, work: (backend: Backend) => Promise<number>): Promise<number> {
  const url = options.url ?? process.env.TUNABLES_URL
  if (url) {
    const token = process.env.TUNABLES_TOKEN
    const client = fetchClient({ baseURL: url, credentials: 'omit', headers: token ? { authorization: `Bearer ${token}` } : {} })
    try {
      return await work({
        scopes: async () => (await client.describe()).scopes,
        entry: (group, scope) => client.group(group, scope),
        save: (group, values, change) => client.save(group, { values, ...change }),
        history: (target, limit) => client.history({ ...target, limit }),
        restore: (revision, change) => client.restore({ revision, ...change })
      })
    } catch (error) {
      if (!(error instanceof TunablesClientError)) throw error
      // The app answers "not found" to anyone it does not allow, so a wrong URL and a refused token look alike.
      const hint = error.status === 404 || error.status === 401 || error.status === 403
        ? ` Check the URL, and that TUNABLES_TOKEN is ${process.env.TUNABLES_TOKEN ? 'one the app allows this' : 'set'}.`
        : ''
      console.error(`✗ ${url} answered ${error.status}: ${error.message}${hint}`)
      return 1
    }
  }
  const { config } = await configAt(cwd, options)
  return connected(config, tunables => work({
    scopes: async () => tunables.definitions.scopes,
    entry: (group, scope) => tunables.entry(group, { scope }),
    save: (group, values, change) => tunables.save(group, values, { ...change, actor: terminalActor() }),
    history: (target, limit) => tunables.history(target, { limit }),
    restore: (revision, change) => tunables.restore(revision, { ...change, actor: terminalActor() })
  }))
}

/** Print a group's values, or one value, as stored. */
export async function runGet(cwd: string, group: string, key: string | undefined, options: ValueOptions & { json?: boolean, scope?: string } = {}): Promise<number> {
  const scope = parseScope(options.scope)
  return withBackend(cwd, options, async (backend) => {
    const entry = await backend.entry(group, scope)
    if (key && !(key in entry.values)) throw new UsageError(`${group} has no "${key}".`)
    if (options.json) {
      console.log(JSON.stringify(key ? entry.values[key] : entry.values, null, 2))
      return 0
    }
    const keys = key ? [key] : Object.keys(entry.values)
    const width = Math.max(...keys.map(item => item.length))
    for (const item of keys) {
      const layer = entry.layers?.[item]
      const note = layer
        ? layer.overridden ? `  (set here; inherits ${layer.inheritedDisplay} from ${layer.fromLabel})` : `  (from ${layer.fromLabel})`
        : entry.changed.includes(item) ? `  (default ${entry.display.defaults[item]})` : ''
      console.log(`${item.padEnd(width)}  ${entry.display.values[item]}${note}`)
    }
    return 0
  })
}

/** Change values from a terminal, through the same checks and history as the screens. */
export async function runSet(cwd: string, group: string, assignments: string[], options: ValueOptions & { reason?: string, yes?: boolean, scope?: string, inherit?: string } = {}): Promise<number> {
  const scope = parseScope(options.scope)
  const inherit = options.inherit?.split(',').map(key => key.trim()).filter(Boolean) ?? []
  if (inherit.length && !scope) throw new UsageError('--inherit needs a --scope: only a scope inherits.')
  if (!assignments.length && !inherit.length) throw new UsageError('Give at least one key=value, or --inherit keys at a --scope.')
  // Rule `a-terminal-change-carries-a-reason`.
  if (!options.reason?.trim()) throw new UsageError('A change from the terminal needs a --reason; it is kept in the history.')
  const values: Record<string, unknown> = {}
  for (const assignment of assignments) {
    const at = assignment.indexOf('=')
    if (at < 1) throw new UsageError(`"${assignment}" is not key=value.`)
    values[assignment.slice(0, at)] = parseValue(assignment.slice(at + 1))
  }
  for (const key of inherit) values[key] = null
  return withBackend(cwd, options, async (backend) => {
    const change = { reason: options.reason, scope }
    let outcome = await backend.save(group, values, change)
    if (outcome.confirm) {
      console.log(outcome.confirm)
      let confirmed = Boolean(options.yes)
      if (!confirmed && process.stdin.isTTY) {
        const answer = await ask({ message: 'Save anyway?' })
        confirmed = !isCancel(answer) && answer === true
      }
      if (!confirmed) {
        console.error('Not saved. Pass --yes to confirm from a script.')
        return 1
      }
      outcome = await backend.save(group, values, { ...change, confirmed: true })
    }
    return printOutcome(outcome)
  })
}

function printRevision(revision: Revision) {
  const changes = revision.changes.map(change => `${change.key}: ${JSON.stringify(change.from)} → ${JSON.stringify(change.to)}`).join('; ')
  console.log(`#${revision.id}  ${revision.at}  ${revision.actor ?? 'someone'}${revision.reason ? `  “${revision.reason}”` : ''}\n    ${changes}`)
}

/** A group's revisions, newest first. */
export async function runHistory(cwd: string, group: string, options: ValueOptions & { limit?: number, json?: boolean, scope?: string } = {}): Promise<number> {
  const scope = parseScope(options.scope)
  return withBackend(cwd, options, async (backend) => {
    const target: RevisionTarget = scope
      ? { kind: 'group', name: group, id: scopeKey(scopeEntries(await backend.scopes(), scope)) }
      : { kind: 'group', name: group }
    const revisions = await backend.history(target, options.limit ?? 20)
    if (options.json) console.log(JSON.stringify(revisions, null, 2))
    else if (!revisions.length) console.log('Nothing has changed yet.')
    else revisions.forEach(printRevision)
    return 0
  })
}

/** Put a group back as it was after an earlier revision, through the same checks. */
export async function runRestore(cwd: string, revision: string, options: ValueOptions & { reason?: string, yes?: boolean } = {}): Promise<number> {
  if (!options.reason?.trim()) throw new UsageError('A restore from the terminal needs a --reason; it is kept in the history.')
  return withBackend(cwd, options, async (backend) => {
    const change = { reason: options.reason }
    let outcome = await backend.restore(revision, change)
    if (outcome.confirm) {
      console.log(outcome.confirm)
      if (!options.yes) {
        console.error('Not restored. Pass --yes to confirm.')
        return 1
      }
      outcome = await backend.restore(revision, { ...change, confirmed: true })
    }
    return printOutcome(outcome)
  })
}
