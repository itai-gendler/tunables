import { confirm as ask, isCancel } from '@clack/prompts'
import type { Outcome, SyncReport } from '../engine/tunables.js'
import type { Revision } from '../engine/store.js'
import { UsageError } from '../core/usage-error.js'
import { configAt, connected, parseValue, terminalActor, type ConfigOptions } from './shared.js'

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
    ...report.presets.map(item => `created the ${item.slot} default of ${item.set}: ${item.key}`),
    ...report.catalog.map(item => `added ${item.id} to ${item.catalog}`)
  ]
  console.log(lines.length ? lines.map(line => `✓ ${line}`).join('\n') : 'Everything is in place.')
  for (const item of report.unknown) console.log(`! ${item.group}.${item.key} is stored but no definition declares it; it was kept.`)
  return 0
}

/** Print a group's values, or one value, as stored. */
export async function runGet(cwd: string, group: string, key: string | undefined, options: ConfigOptions & { json?: boolean } = {}): Promise<number> {
  const { config } = await configAt(cwd, options)
  return connected(config, async (tunables) => {
    const entry = await tunables.entry(group)
    if (key && !(key in entry.values)) throw new UsageError(`${group} has no "${key}".`)
    if (options.json) {
      console.log(JSON.stringify(key ? entry.values[key] : entry.values, null, 2))
      return 0
    }
    const keys = key ? [key] : Object.keys(entry.values)
    const width = Math.max(...keys.map(item => item.length))
    for (const item of keys) {
      const changed = entry.changed.includes(item) ? `  (default ${entry.display.defaults[item]})` : ''
      console.log(`${item.padEnd(width)}  ${entry.display.values[item]}${changed}`)
    }
    return 0
  })
}

/** Change values from a terminal, through the same checks and history as the screens. */
export async function runSet(cwd: string, group: string, assignments: string[], options: ConfigOptions & { reason?: string, yes?: boolean } = {}): Promise<number> {
  if (!assignments.length) throw new UsageError('Give at least one key=value.')
  // Rule `a-terminal-change-carries-a-reason`.
  if (!options.reason?.trim()) throw new UsageError('A change from the terminal needs a --reason; it is kept in the history.')
  const values: Record<string, unknown> = {}
  for (const assignment of assignments) {
    const at = assignment.indexOf('=')
    if (at < 1) throw new UsageError(`"${assignment}" is not key=value.`)
    values[assignment.slice(0, at)] = parseValue(assignment.slice(at + 1))
  }
  const { config } = await configAt(cwd, options)
  return connected(config, async (tunables) => {
    const change = { actor: terminalActor(), reason: options.reason }
    let outcome = await tunables.save(group, values, change)
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
      outcome = await tunables.save(group, values, { ...change, confirmed: true })
    }
    return printOutcome(outcome)
  })
}

function printRevision(revision: Revision) {
  const changes = revision.changes.map(change => `${change.key}: ${JSON.stringify(change.from)} → ${JSON.stringify(change.to)}`).join('; ')
  console.log(`#${revision.id}  ${revision.at}  ${revision.actor ?? 'someone'}${revision.reason ? `  “${revision.reason}”` : ''}\n    ${changes}`)
}

/** A group's revisions, newest first. */
export async function runHistory(cwd: string, group: string, options: ConfigOptions & { limit?: number, json?: boolean } = {}): Promise<number> {
  const { config } = await configAt(cwd, options)
  return connected(config, async (tunables) => {
    const revisions = await tunables.history(group, { limit: options.limit ?? 20 })
    if (options.json) console.log(JSON.stringify(revisions, null, 2))
    else if (!revisions.length) console.log('Nothing has changed yet.')
    else revisions.forEach(printRevision)
    return 0
  })
}

/** Put a group back as it was after an earlier revision, through the same checks. */
export async function runRestore(cwd: string, revision: string, options: ConfigOptions & { reason?: string, yes?: boolean } = {}): Promise<number> {
  if (!options.reason?.trim()) throw new UsageError('A restore from the terminal needs a --reason; it is kept in the history.')
  const { config } = await configAt(cwd, options)
  return connected(config, async (tunables) => {
    const change = { actor: terminalActor(), reason: options.reason }
    let outcome = await tunables.restore(revision, change)
    if (outcome.confirm) {
      console.log(outcome.confirm)
      if (!options.yes) {
        console.error('Not restored. Pass --yes to confirm.')
        return 1
      }
      outcome = await tunables.restore(revision, { ...change, confirmed: true })
    }
    return printOutcome(outcome)
  })
}
