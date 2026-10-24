---
title: Checks and guards
description: Rules across settings, guards for what your app keeps, within for presets, confirmations for costly changes, and notes.
group: Concepts
order: 6
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
   after the change, and refuses a change that would leave a workspace's or a
   person's own value outside its [bound](./scopes.md#bounds);
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
export const workspace = defineGroup({
  id: 'workspace',
  title: 'Workspace',
  fields: {
    dueSoonDays: number({ label: 'Due soon', unit: 'days', default: 2, max: 30, override: ['workspace', 'user'] }),
    archiveAfterDays: number({ label: 'Archive done tasks after', unit: 'days', default: 30, max: 365, override: ['workspace'] })
  },
  rules: values => values.dueSoonDays > values.archiveAfterDays
    ? [{ key: 'dueSoonDays', message: 'Due soon may not be longer than the time before done tasks are archived.' }]
    : []
})
```

At a [scope](./scopes.md), `rules` runs on the values as read there after the
change: Dana's *Due soon* is checked against the archive time Acme sets.

Because `rules` sees only its own group, settings that bound one another
belong in one group.

## Guards for what your app keeps

A guard checks the records your app keeps that depend on a group: lowering
*Tasks per project* below what a project already holds would strand that
project. Guards are registered per group when you create tunables, so
they can reach your database.

```ts
import { createTunables, type Guard } from 'tunables'

const projectsWithinLimit: Guard = async ({ next, scope, host }) => {
  const db = (host as typeof sql | undefined) ?? sql // the CLI passes no host
  const limit = Number(next.maxTasksPerProject)
  const over = scope.workspace
    ? await db`select name, open_tasks from projects where workspace = ${scope.workspace} and open_tasks > ${limit}`
    : await db`select name, open_tasks from projects where open_tasks > ${limit}`
  return over.map(project => `Project "${project.name}" has ${project.open_tasks} open tasks, above the ${limit} allowed.`)
}

export const tunables = createTunables({
  store,
  groups,
  guards: { limits: [projectsWithinLimit] }
})
```

A guard receives:

| Argument | What it is |
| --- | --- |
| `group` | The group's id. |
| `scope` | Where the change is made: `{}` for the whole system, or a path such as `{ workspace: 'acme' }`. |
| `next` | The group's values as they would be after the change, as read at `scope`. |
| `previous` | The values now, as read at `scope`. |
| `session` | The store session the save runs in. |
| `host` | What the save was given as `host`: from the server's `host` option, or from the code that called `save`. |

Write a guard so it works without `host`, because `tunables set` from a
terminal passes none. Guards run in the order given; the first that returns
problems ends the check.

### Holding the settings while you write

A guard reads your records at the moment of the save. If your app is adding
a task at that same moment, against the old limit, the guard cannot see it
yet. `hold` closes that gap: inside your own transaction, take tunables' lock
in shared mode before you read the limit and write the record. A change to
tunables takes the same lock exclusively, so a lowering waits until your write
commits, and its guard then sees the new task.

```ts
await sql.begin(async (tx) => {
  const scoped = tunables.within(tx)
  await scoped.hold()
  const { maxTasksPerProject } = await scoped.get('limits', { scope: { workspace: project.workspace } })
  if (project.openTasks >= maxTasksPerProject) {
    throw new Error(`A project may hold ${maxTasksPerProject} open tasks.`)
  }
  await tx`insert into tasks (project_id, title) values (${project.id}, ${input.title})`
})
```

`within` and `hold` are described in [Storage](./storage.md#transactions).

## Presets stay within the settings

A preset set's `within` says how the settings bound each preset. It runs when
a preset is saved, and on every group save, against every stored preset. So
lowering a limit below a preset is refused, naming the preset:

```
Plan "Team": its Projects, 500, is above the ceiling of 400.
```

See [Presets](./presets.md#within).

## Overrides stay within their bounds

A workspace's or a person's own value is checked against what it inherits,
and every broader change is checked against the values below it. Raising
Acme's *Projects* above its plan, or editing the plan below what Acme keeps,
is refused, naming the scope:

```
Projects may be at most 50 for Acme, the value it inherits.
Plan "Pro": Acme keeps Projects at 20, above 10.
```

See [Scopes](./scopes.md#refusals).

## Confirmations for costly changes

Some changes are allowed but have consequences: they cost money, redo work,
or show something to more people.
`confirm` compares the change with what is stored and returns the question to
answer, or nothing.

```ts
export const workspace = defineGroup({
  id: 'workspace',
  title: 'Workspace',
  fields: { /* … */ },
  confirm: (next, previous) => next.guestAccess && !previous.guestAccess
    ? 'Guests will see every task in the project they are invited to, including its comments and attachments.'
    : undefined
})
```

A change that asks comes back with `saved: false` and `confirm` set, and
nothing is stored. Send the same change again with `confirmed: true` to save it:

```ts
const acme = { workspace: 'acme' }
let outcome = await tunables.save('workspace', { guestAccess: true }, { actor, scope: acme })
if (outcome.confirm && await askPerson(outcome.confirm)) {
  outcome = await tunables.save('workspace', { guestAccess: true }, { actor, scope: acme, confirmed: true })
}
```

The form shows the question in a dialog; `tunables set` asks at the terminal,
or takes `--yes`. The question is asked only once every check has passed, so
a person never confirms a change that would be refused anyway.

## Notes

A note says what a value means here and now, under the field: *"312 done
tasks would be archived tonight."* Notes are read-only; they never refuse
anything. Register a notes provider per group:

```ts
import type { NotesProvider } from 'tunables'

const workspaceNotes: NotesProvider = async ({ values, host }) => {
  const db = (host as typeof sql | undefined) ?? sql
  const [{ count }] = await db`select count(*)::int as count from tasks
    where done_at < now() - make_interval(days => ${Number(values.archiveAfterDays)}) and not archived`
  return { archiveAfterDays: `${count} done tasks would be archived tonight.` }
}

createTunables({ store, groups, notes: { workspace: workspaceNotes } })
```

It returns, by field key, a note or a list of notes. They reach the screens in
the group's [entry](./settings-and-groups.md#the-entry).

## Catalog entries in use

A catalog's entries cannot be retired while something uses them. Settings and
presets that pick an entry count on their own; register `uses` to add what
your app keeps.
See [Catalogs](./catalogs.md#what-uses-an-entry).

## Testing your checks

Cover each rule, guard and confirmation through `save` in your tests: refused
with its problem, asked, then saved with `confirmed: true`. See
[Testing](./testing.md).
