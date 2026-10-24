# Guards and confirmations

Lowering a limit must never break what uses it, and a change with costly
consequences must be confirmed. Each mechanism below has one job; pick by what
depends on the value.

| What depends on the value | Mechanism | Where it is declared |
| --- | --- | --- |
| Another setting in the same group | `rules` | the group |
| Fields of one preset, or a catalog entry it picks | `rules` | the preset set |
| Presets, bounded by settings | `within` | the preset set |
| A workspace's or person's own value, bounded by what it inherits | `override: { scope: 'at-most' }` | the field |
| Rows the app keeps, bounded by a setting | a guard, and `hold` on the write | `guards` in `createTunables`; the app's write path |
| Only new additions (a per-user count) | the check where things are added | the app's code |
| App data that uses a catalog entry | `uses` | `createTunables` |
| Work, cost or people a change reaches | `confirm` | the group |
| What a value means here and now | `notes` | `createTunables` |

Every problem is written for the administrator who sees it: name both
settings, or the thing that is in the way, and the values.

## rules — settings that bound one another

A group's `rules(values)` runs on every save with the values as they would be
after it. Return strings, or `{ key, message }` to attach a problem to one
field. It sees only its own group. A save at a scope runs them on the values
as read there, own and inherited together. Tasklane's Workspace group:

```ts
rules: values => values.dueSoonDays > values.archiveAfterDays
  ? [{ key: 'dueSoonDays', message: 'Due soon may not be longer than the time before done tasks are archived.' }]
  : []
```

A preset set's `rules(values, catalogs)` bound the fields of one preset, and
can read the entry a `pick` names. They run when a preset is saved, and again
for every preset when a catalog entry is edited, so an edit that would break a
preset is refused, naming it. For a plan that picks its own model and has an
AI budget:

```ts
rules: (values, catalogs) => {
  const model = catalogs.entry('models', values.suggestionModel)
  const cents = Number(model?.values.centsPerSuggestion ?? 0) * values.aiSuggestionsPerDay
  return model && cents > values.aiBudgetCentsPerDay
    ? [{ key: 'aiSuggestionsPerDay', message: `${values.aiSuggestionsPerDay} suggestions a day on ${String(model.values.label)} cost more than the plan's AI budget.` }]
    : []
}
```

## within — presets bounded by settings

A preset set's `within(values, settings)` reads any group with
`settings.get(groupId)`. It runs when a preset is saved and whenever a group is
saved, against every stored preset: lowering a limit below a preset is refused,
naming the preset.

```ts
within: (values, settings) => {
  const platform = settings.get('platform') as { attachmentCeilingMb: number }
  return values.attachmentMb > platform.attachmentCeilingMb
    ? [`its Attachment size, ${values.attachmentMb} MB, is above the ceiling of ${platform.attachmentCeilingMb} MB.`]
    : []
}
```

Problems are prefixed with the preset (`Plan "Team": its Attachment size …`).

## override bounds — a scope's own value

A field declared `override: { workspace: 'at-most' }` may be set for a
workspace, but never above what the workspace inherits from the system and its
plan. Both directions are checked by tunables itself, with no code: a
workspace's value above its bound is refused ("Projects may be at most 50 for
Acme, the value it inherits."), and so is a broader change that would leave an
override outside its bound, whether a system value, a plan's value, a plan
assignment or a broader override ("Acme keeps Projects at 20, above 10.").
Name the scope with `scopeLabel` in `createTunables`, or refusals read
"Workspace acme".

## Guards — rows the app keeps

A guard is a check of the app's own data, run on every save of its group after
the group's rules and `within`. It receives `{ group, scope, next, previous,
session, host }`; `scope` is the path saved (`{}` for the system) and `next`
the values as read there, so a guard for an overridable field checks only that
workspace's or person's rows. `host` is what the server's `host(context)`
returned, or what app code passed as `host` in its change options, and is
`undefined` from the CLI. Return a problem for each row in the way.

```ts
import type { Guard } from 'tunables'

/** Lowering the Longest repeat below a recurring task's own is refused, naming the task. */
export const recurringWithin: Guard = async ({ next, host }) => {
  const db = (host as typeof sql | undefined) ?? sql
  const limit = Number(next.longestRepeatDays)
  const over = await db`select title, repeat_days from tasks where repeat_days > ${limit}`
  return over.map(task => `Task "${task.title}" repeats every ${task.repeat_days} days, above the Longest repeat of ${limit} days.`)
}

createTunables({ /* … */ guards: { tasks: [recurringWithin] } })
```

To test a guard without a database, build it from a function that returns the
rows (`recurringAbove(tasks: (host) => rows)`), and hand it fixed rows in the
test.

A guard alone leaves a race: a task saved while the limit is being lowered.
Close it on the app's write path: inside the transaction that saves the row,
take tunables' shared lock and check against the values it holds. A save of
the group takes the exclusive lock, so one waits for the other.

```ts
await sql.begin(async (tx) => {
  const scoped = tunables.within(tx)
  await scoped.hold()
  const { longestRepeatDays } = await scoped.get('tasks')
  if (input.repeatDays > longestRepeatDays) throw new Error(`A task may repeat at most every ${longestRepeatDays} days.`)
  await tx`update tasks set repeat_days = ${input.repeatDays} where id = ${input.id}`
})
```

`hold` only works on `tunables.within(transaction)`, with the driver's
transaction (postgres.js `sql.begin`, node-postgres inside `begin`).

A limit that only caps new additions — Tasklane's Projects, Tasks per
project — needs no guard. Check the count where something is added, read at
the workspace's path (`get('limits', { scope: { workspace } })`); lowering the
limit keeps what a workspace already has.

## uses — what uses a catalog entry

Retiring a catalog entry is refused while anything uses it. Presets that
`pick` it, and group values that pick it for the system or at any scope, are
found by themselves; name the app's own users with `uses`:

```ts
createTunables({ /* … */ uses: { models: async ({ entry, host }) => (await projectsUsing(entry, host)).map(project => `Project "${project.name}"`) } })
```

## confirm — consequences

A group's `confirm(next, previous)` returns a sentence naming the consequence
when this change has one, or `undefined`. The save is then refused with
`confirm` set, and goes through only when sent again confirmed (the screens
ask; the CLI asks, or takes `--yes`; code passes `{ confirmed: true }`).

```ts
confirm: (next, previous) => next.guestAccess && !previous.guestAccess
  ? 'Guests will see every task in the project they are invited to, including its comments and attachments.'
  : undefined
```

At a scope, `next` and `previous` are the values as read there, so turning
Guests on for one workspace asks too.

Confirm only what costs money, redoes work, or reaches people at once. Compare
only the fields that trigger it, so an unrelated save is not interrupted. A
field whose `affects` include a `warn` effect is the usual candidate.

## notes — what a value means now

Notes are shown under a field and explain its value in terms of the app's data
at this moment. They never refuse anything.

```ts
createTunables({
  /* … */
  notes: {
    workspace: async ({ values, host }) => ({
      archiveAfterDays: `${await countDoneOlderThan(values.archiveAfterDays, host)} done tasks would be archived tonight.`
    })
  }
})
```

## Testing them

```ts
import { setForTest, testTunables } from 'tunables/testing'

// A guard that takes its rows from a function can be handed them in a test.
const tunables = await testTunables({ groups, presets, catalogs, effects, scopes, scopeLabel, guards: { tasks: [recurringAbove(() => tasks)] } })

const refused = await tunables.save('workspace', { archiveAfterDays: 1 })
expect(refused.saved).toBe(false)
expect(refused.problems.map(problem => problem.message)).toContain('Due soon may not be longer than the time before done tasks are archived.')

const asked = await tunables.save('workspace', { guestAccess: true })
expect(asked.confirm).toMatch(/Guests will see every task/)
expect((await tunables.save('workspace', { guestAccess: true }, { confirmed: true })).saved).toBe(true)

// A bound at a scope: Acme is on Pro, which allows 50 projects.
await tunables.presets('plans').assign('acme', 'plan', 'pro', { actor: 'test' })
const above = await tunables.save('limits', { maxProjects: 80 }, { scope: { workspace: 'acme' } })
expect(above.problems[0]?.message).toBe('Projects may be at most 50 for Acme, the value it inherits.')

await setForTest(tunables, { limits: { maxProjects: 1 } }) // start past the checks
```
