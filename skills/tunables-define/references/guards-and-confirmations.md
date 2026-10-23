# Guards and confirmations

Lowering a limit must never break what uses it, and a change with costly
consequences must be confirmed. Each mechanism below has one job; pick by what
depends on the value.

| What depends on the value | Mechanism | Where it is declared |
| --- | --- | --- |
| Another setting in the same group | `rules` | the group |
| Fields of one preset, or a catalog entry it picks | `rules` | the preset set |
| Presets, bounded by settings | `within` | the preset set |
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
field. It sees only its own group.

```ts
rules: (values) => {
  const problems: string[] = []
  if (!(values.jobExpirySeconds > values.attemptSeconds)) problems.push('Job expiry must be longer than Attempt time limit.')
  if (values.newFeedLookbackDays > values.maxLookbackDays) problems.push('New-feed lookback days may not exceed the Longest lookback.')
  return problems
}
```

A preset set's `rules(values, catalogs)` bound the fields of one preset, and
can read the entry a `pick` names. They run when a preset is saved, and again
for every preset when a catalog entry is edited, so an edit that would break a
preset is refused, naming it.

```ts
rules: (values, catalogs) => {
  const model = catalogs.entry('models', values.model)
  const efforts = (model?.values.efforts ?? []) as string[]
  return model && !efforts.includes(values.effort)
    ? [{ key: 'effort', message: `${String(model.values.label)} does not take effort "${values.effort}".` }]
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
  const limits = settings.get('run') as { budgetLimitUsd: number, turnsLimit: number }
  const problems: string[] = []
  if (values.maxBudgetUsd > limits.budgetLimitUsd) problems.push(`its Budget is above the Budget limit of $${limits.budgetLimitUsd}.`)
  if (values.maxTurns > limits.turnsLimit) problems.push(`its Turns, ${values.maxTurns}, are above the Turns limit of ${limits.turnsLimit}.`)
  return problems
}
```

Problems are prefixed with the preset (`Run Config "Daily brief": its Budget …`).

## Guards — rows the app keeps

A guard is a check of the app's own data, run on every save of its group after
the group's rules and `within`. It receives `{ group, next, previous, session,
host }`; `host` is what the server's `host(context)` returned, or what app code
passed as `host` in its change options, and is `undefined` from the CLI.
Return a problem for each row in the way.

```ts
import type { Guard } from 'tunables'

export const feedsWithin: Guard = async ({ next, host }) => {
  const db = (host as typeof sql | undefined) ?? sql
  const limit = Number(next.maxArticlesPerRetrieval)
  const over = await db`select name, max_articles from feeds where max_articles > ${limit}`
  return over.map(feed => `Feed "${feed.name}" reads ${feed.max_articles} articles, above the Most articles per retrieval of ${limit}.`)
}

createTunables({ /* … */ guards: { collection: [feedsWithin] } })
```

To test a guard without a database, build it from a function that returns the
rows, as `feedsAbove(feeds: (host) => rows)` does, and hand it fixed rows in
the test.

A guard alone leaves a race: a Feed saved while the limit is being lowered.
Close it on the app's write path: inside the transaction that saves the row,
take tunables' shared lock and check against the values it holds. A save of
the group takes the exclusive lock, so one waits for the other.

```ts
await sql.begin(async (tx) => {
  const scoped = tunables.within(tx)
  await scoped.hold()
  const { maxArticlesPerRetrieval } = await scoped.get('collection')
  if (input.maxArticles > maxArticlesPerRetrieval) throw new Error(`A Feed may read at most ${maxArticlesPerRetrieval} articles.`)
  await tx`update feeds set max_articles = ${input.maxArticles} where id = ${input.id}`
})
```

`hold` only works on `tunables.within(transaction)`, with the driver's
transaction (postgres.js `sql.begin`, node-postgres inside `begin`).

A limit that only caps new additions — Briefs per reader, Feeds per Brief —
needs no guard. Check the count where something is added; lowering the limit
keeps what readers already have.

## uses — what uses a catalog entry

Retiring a catalog entry is refused while anything uses it. Presets that
`pick` it are found by themselves; name the app's own users with `uses`:

```ts
createTunables({ /* … */ uses: { models: async ({ entry, host }) => (await briefsUsing(entry, host)).map(brief => `Brief "${brief.name}"`) } })
```

## confirm — consequences

A group's `confirm(next, previous)` returns a sentence naming the consequence
when this change has one, or `undefined`. The save is then refused with
`confirm` set, and goes through only when sent again confirmed (the screens
ask; the CLI asks, or takes `--yes`; code passes `{ confirmed: true }`).

```ts
confirm: (next, previous) => {
  const redone = [
    next.screeningReasonWords !== previous.screeningReasonWords ? 'Screening reason length' : undefined,
    next.descriptionScreenedCharacters !== previous.descriptionScreenedCharacters ? 'Description screened' : undefined
  ].filter(Boolean)
  return redone.length
    ? `Changing ${redone.join(' and ')} redoes every saved Screening judgment the next time each Brief is screened, which costs model calls.`
    : undefined
}
```

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
    collection: async ({ values, host }) => ({
      scheduledCollection: `Every Feed would collect ${await countOfficialFeeds(host)} official Feeds.`
    })
  }
})
```

## Testing them

```ts
import { setForTest, testTunables } from 'tunables/testing'

// A guard that takes its rows from a function can be handed them in a test.
const tunables = await testTunables({ groups, presets, catalogs, units, effects, guards: { collection: [feedsAbove(() => feeds)] } })

const refused = await tunables.save('collection', { attemptSeconds: 400 })
expect(refused.saved).toBe(false)
expect(refused.problems.map(problem => problem.message)).toContain('Job expiry must be longer than Attempt time limit.')

const asked = await tunables.save('run', { screeningReasonWords: 20 })
expect(asked.confirm).toMatch(/redoes every saved Screening judgment/)
expect((await tunables.save('run', { screeningReasonWords: 20 }, { confirmed: true })).saved).toBe(true)

await setForTest(tunables, { run: { budgetLimitUsd: 1 } }) // start past the checks
```
