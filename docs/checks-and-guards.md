---
title: Checks and guards
description: Rules across settings, guards for what your app keeps, within for presets, confirmations for costly changes, and notes.
group: Concepts
order: 5
---

# Checks and guards

A save is checked whole before anything is written. When any check refuses
it, nothing is stored, and the outcome lists each problem in words. A check is
a function you write in plain TypeScript; it returns its problems, and
returning nothing means it passes.

## The order of a save

When `save`, `reset` or `restore` changes a group, tunables:

1. takes the tunables lock, so no other change runs at the same time;
2. refuses keys the group does not declare;
3. checks each field on its own, from its [kind](./kinds-and-units.md);
4. runs the group's **`rules`**;
5. runs every preset set's **`within`** against the settings as they would be
   after the change;
6. runs the group's **guards**, with your transaction or request as `host`;
7. stops if nothing changed: the save succeeds without a revision;
8. asks the group's **`confirm`** question, unless the change is `confirmed`;
9. writes the group and appends a [revision](./history-and-restore.md), in one
   transaction.

Field problems are all reported together; later steps run only once the
earlier ones pass, so a rule never sees a value of the wrong type.

## What a check returns

Every check returns a `RuleResult`: an array of problems, or nothing. A problem
is a sentence, or `{ key, message }` when it is about one field, so the screens
show it beside that field.

```ts
type RuleResult = readonly (Problem | string)[] | undefined | void
interface Problem { key?: string, message: string }
```

Write problems the way the setting reads to the person changing it: name the
fields by their labels, say the limit, and say what is in the way.

## Rules across settings

`rules` checks the fields of one group against each other. It receives the
whole group as it would be after the change, with its types.

```ts
export const collection = defineGroup({
  id: 'collection',
  title: 'Collection Settings',
  fields: {
    attemptSeconds: number({ label: 'Attempt time limit', unit: 'seconds', default: 300 }),
    jobExpirySeconds: number({ label: 'Job expiry', unit: 'seconds', default: 360 }),
    jobHeartbeatSeconds: number({ label: 'Job heartbeat', unit: 'seconds', default: 30 })
  },
  rules: (values) => {
    const problems: string[] = []
    if (!(values.jobExpirySeconds > values.attemptSeconds)) problems.push('Job expiry must be longer than Attempt time limit.')
    if (!(values.jobHeartbeatSeconds < values.jobExpirySeconds)) problems.push('Job heartbeat must be shorter than Job expiry.')
    return problems
  }
})
```

Because `rules` sees only its own group, settings that bound one another
belong in one group.

## Guards for what your app keeps

A guard checks the records your app keeps that depend on a group: lowering
*Most articles per retrieval* below what a Feed is configured to read would
strand that Feed. Guards are registered per group when you create tunables, so
they can reach your database.

```ts
import { createTunables, type Guard } from 'tunables'

const feedsWithinBounds: Guard = async ({ next, host }) => {
  const db = (host as typeof sql | undefined) ?? sql // the CLI passes no host
  const limit = Number(next.maxArticlesPerRetrieval)
  const over = await db`select name, max_articles from feeds where max_articles > ${limit}`
  return over.map(feed => `Feed "${feed.name}" reads ${feed.max_articles} articles, above the Most articles per retrieval of ${limit}.`)
}

export const tunables = createTunables({
  store,
  groups,
  guards: { collection: [feedsWithinBounds] }
})
```

A guard receives:

| Argument | What it is |
| --- | --- |
| `group` | The group's id. |
| `next` | The group's values as they would be after the change. |
| `previous` | The values stored now. |
| `session` | The store session the save runs in. |
| `host` | What the save was given as `host`: from the server's `host` option, or from the code that called `save`. |

Write a guard so it works without `host`, because `tunables set` from a
terminal passes none. Guards run in the order given; the first that returns
problems ends the check.

### Holding the settings while you write

A guard reads your records at the moment of the save. If your app is writing
a Feed at that same moment, against the old limit, the guard cannot see it
yet. `hold` closes that gap: inside your own transaction, take tunables' lock
in shared mode before you read the limit and write the record. A change to
tunables takes the same lock exclusively, so a lowering waits until your write
commits, and its guard then sees the new Feed.

```ts
await sql.begin(async (tx) => {
  const scoped = tunables.within(tx)
  await scoped.hold()
  const { maxArticlesPerRetrieval } = await scoped.get('collection')
  if (input.maxArticles > maxArticlesPerRetrieval) {
    throw new Error(`A Feed may read at most ${maxArticlesPerRetrieval} articles.`)
  }
  await tx`update feeds set max_articles = ${input.maxArticles} where id = ${input.id}`
})
```

`within` and `hold` are described in [Storage](./storage.md#transactions).

## Presets stay within the settings

A preset set's `within` says how the settings bound each preset. It runs when
a preset is saved, and on every group save, against every stored preset. So
lowering a limit below a preset is refused, naming the preset:

```
Run Config "Weekly brief": its Story ceiling, 15, is above the Story limit of 12.
```

See [Presets](./presets.md#within).

## Confirmations for costly changes

Some changes are allowed but have consequences: they cost money, or redo work.
`confirm` compares the change with what is stored and returns the question to
answer, or nothing.

```ts
export const run = defineGroup({
  id: 'run',
  title: 'Run Settings',
  fields: { /* … */ },
  confirm: (next, previous) => next.screeningReasonWords !== previous.screeningReasonWords
    ? 'Changing Screening reason length redoes every saved Screening judgment the next time each Brief is screened, which costs model calls.'
    : undefined
})
```

A change that asks comes back with `saved: false` and `confirm` set, and
nothing is stored. Send the same change again with `confirmed: true` to save it:

```ts
let outcome = await tunables.save('run', { screeningReasonWords: 20 }, { actor })
if (outcome.confirm && await askPerson(outcome.confirm)) {
  outcome = await tunables.save('run', { screeningReasonWords: 20 }, { actor, confirmed: true })
}
```

The form shows the question in a dialog; `tunables set` asks at the terminal,
or takes `--yes`. The question is asked only once every check has passed, so
a person never confirms a change that would be refused anyway.

## Notes

A note says what a value means here and now, under the field: *"Every Feed
would collect 12 official Feeds."* Notes are read-only; they never refuse
anything. Register a notes provider per group:

```ts
import type { NotesProvider } from 'tunables'

const collectionNotes: NotesProvider = async ({ host }) => {
  const [{ count }] = await ((host as typeof sql | undefined) ?? sql)`select count(*)::int as count from feeds where official`
  return { scheduledCollection: `Every Feed would collect ${count} official Feeds.` }
}

createTunables({ store, groups, notes: { collection: collectionNotes } })
```

It returns, by field key, a note or a list of notes. They reach the screens in
the group's [entry](./settings-and-groups.md#the-entry).

## Catalog entries in use

A catalog's entries cannot be retired while something uses them. Presets that
pick an entry count on their own; register `uses` to add what your app keeps.
See [Catalogs](./catalogs.md#what-uses-an-entry).

## Testing your checks

Cover each rule, guard and confirmation through `save` in your tests: refused
with its problem, asked, then saved with `confirmed: true`. See
[Testing](./testing.md).
