---
title: What it is for
description: The kinds of value tunables keeps — live limits, plans, per-workspace and per-person values, model choices, values that bound each other, costly switches — and the feature that does each.
group: Get started
order: 3
---

# What it is for

tunables keeps the values someone decides while the app runs. Most apps have
the same handful of kinds of them. This page names each, with a short example
from [Tasklane](./tasklane-example.md), a todo app with workspaces and the
people in them, and the feature that does it.

## Limits staff tune live

*How many projects a workspace may have. How large an attachment may be.*
Values that start as constants, get moved to environment variables, and then
need changing on a Friday afternoon without a deploy.

```ts
export const limits = defineGroup({
  id: 'limits',
  title: 'Limits',
  place: { label: 'Admin › Limits', href: '/admin/limits' },
  fields: {
    maxProjects: number({ label: 'Projects', unit: 'count', default: 3, max: 10000 }),
    attachmentMb: number({ label: 'Attachment size', unit: 'megabytes', default: 10, max: 2048 })
  }
})
```

A [group](./settings-and-groups.md), its form placed beside what it affects
with [`TunablesGroupForm`](./nuxt-layer.md#tunablesgroupform), and a
[revision](./history-and-restore.md) for every change.

## Plans and tiers

*Free gets 3 projects, Pro 50, Team 500.* A plan is a named set of values a
workspace is on. Staff edit Pro once and every workspace on Pro has the new
limits.

```ts
export const plans = definePresets({
  id: 'plans',
  title: 'Plans',
  slots: ['plan'],
  layer: { group: 'limits', scope: 'workspace' },
  fields: { maxProjects: number({ label: 'Projects', unit: 'count', default: 3 }) },
  seed: [
    { key: 'free', slot: 'plan', label: 'Free', values: { maxProjects: 3 } },
    { key: 'pro', slot: 'plan', label: 'Pro', values: { maxProjects: 50 } }
  ]
})

await tunables.presets('plans').assign('acme', 'plan', 'pro', { actor })
```

[Presets](./presets.md), assigned by reference. With `layer`, the plan is read
as a [layer](./scopes.md#plans-as-a-layer) of Limits, so
`get('limits', { scope: { workspace: 'acme' } })` returns Pro's values.
Without `layer`, resolve the preset yourself with
`presets('plans').resolve('acme', 'plan')`.

## Per-workspace and per-person values

*Acme wants fewer projects than Pro allows. Dana's week starts on Sunday.*
Each workspace and person sets its own, within what it inherits.

```ts
maxProjects: number({ label: 'Projects', unit: 'count', default: 3, override: { workspace: 'at-most' } }),
weekStartsOn: number({ label: 'Week starts on', unit: 'weekday', default: 1, override: ['workspace', 'user'] }),
```

```ts
await tunables.save('limits', { maxProjects: 20 }, { scope: { workspace: 'acme' }, actor: 'Olivia' })
const { weekStartsOn } = await tunables.get('workspace', { scope: { workspace: 'acme', user: 'dana' } })
```

[Scopes](./scopes.md): `scopes` declares the chain, `override` says who may
set a field and how far, and a scoped form lets an owner or a person change
their own, allowed by [`authorize`](./access.md#self-service-per-scope).

## Cost and AI models

*Which model drafts task suggestions, and what one costs.* A list of allowed
choices that settings pick from, where an entry still in use cannot be
removed.

```ts
export const models = defineCatalog({
  id: 'models',
  title: 'Models',
  fields: { label: text({ label: 'Label', default: '' }), centsPerSuggestion: number({ label: 'Cost a suggestion', unit: 'count', default: 1 }) },
  seed: [{ id: 'small', values: { label: 'Small and quick', centsPerSuggestion: 1 } }]
})

suggestionModel: pick({ label: 'Suggestion model', catalog: 'models', default: 'small', affects: ['cost'] })
```

A [catalog](./catalogs.md). Retiring *Small and quick* while the system or any
workspace picks it is refused: *"Small and quick is in use by Workspace ›
Suggestion model; move them to another model first."* Mark the effect `cost`
with `warn: true` and the screens flag every field that spends money.

## Settings that bound each other

*Due soon may not be longer than the time before done tasks are archived.*
Two settings that only make sense together.

```ts
rules: values => values.dueSoonDays > values.archiveAfterDays
  ? [{ key: 'dueSoonDays', message: 'Due soon may not be longer than the time before done tasks are archived.' }]
  : []
```

A group's [`rules`](./checks-and-guards.md#rules-across-settings), run on the
whole group as it would be after the change, at whatever scope the change is
made.

## Presets bounded by settings

*No plan may offer more projects than the system's hard ceiling.* A preset is
checked against settings, and a setting cannot be lowered below a preset.

```ts
within: (values, settings) => {
  const { projectCeiling } = settings.get('ceilings') as { projectCeiling: number }
  return values.maxProjects > projectCeiling ? [`its Projects, ${values.maxProjects}, is above the ceiling of ${projectCeiling}.`] : []
}
```

A preset set's [`within`](./presets.md#within). Lowering the ceiling below
Team's 500 is refused: *"Plan "Team": its Projects, 500, is above the ceiling
of 400."* Plans that are a layer are also held by every workspace's own
values: editing Pro below what Acme keeps is refused, naming Acme.

## Changes with consequences

*Turning on Guests shows every task in a project to people outside the
workspace.* Allowed, but asked first.

```ts
confirm: (next, previous) => next.guestAccess && !previous.guestAccess
  ? 'Guests will see every task in the project they are invited to, including its comments and attachments.'
  : undefined
```

[`confirm`](./checks-and-guards.md#confirmations-for-costly-changes): the form
shows the question in a dialog, `tunables set` asks at the terminal, and
nothing is saved until the change is sent again confirmed.

## Guards that check your app's own data

*Lowering Tasks per project below what a project already holds strands it.*
The check needs your app's tables, not tunables'.

```ts
const projectsWithin: Guard = async ({ next, scope, host }) => {
  const db = (host as Sql | undefined) ?? sql
  const over = await db`select name, open_tasks from projects
    where open_tasks > ${Number(next.maxTasksPerProject)} and (${scope.workspace ?? null}::text is null or workspace = ${scope.workspace ?? null})`
  return over.map(project => `Project "${project.name}" has ${project.open_tasks} open tasks, above ${String(next.maxTasksPerProject)}.`)
}

createTunables({ store, groups, guards: { limits: [projectsWithin] } })
```

[Guards](./checks-and-guards.md#guards-for-what-your-app-keeps), registered
per group, run on every save with the scope it is made at. Writes in your app
that depend on a limit take [`hold`](./storage.md#hold), so a lowering waits
for them and its guard sees them.

## Reading values in handlers and jobs

*A request handler checks the limit for the person asking. A worker sends
reminders at each person's hour.* Read at the point of use, every time.

```ts
// In a request handler: the value for this person.
const limits = await tunables.get('limits', { scope: { workspace: person.workspace, user: person.id } })

// In a long-running job: keep working on the last values read if the database blips.
const { reminderHour } = await tunables.get('workspace', { scope, lastGood: true })

// Inside your own transaction: hold the settings while you write what depends on them.
await sql.begin(async (tx) => {
  const inTx = tunables.within(tx)
  await inTx.hold()
  const { maxTasksPerProject } = await inTx.get('limits', { scope: { workspace: project.workspace } })
  if (project.openTasks >= maxTasksPerProject) throw new Error('This project is full.')
  await tx`insert into tasks (project_id, title) values (${project.id}, ${title})`
})
```

[`get`](./settings-and-groups.md#reading-values) returns every field or
throws; never write a fallback. `lastGood` returns the last values this
process read when a read fails. [`within` and `hold`](./storage.md#transactions)
join your transaction; `committed()` tells `onChange` listeners once it has
committed.

## Deployment values are not settings

*The database URL, a lock id, the log level.* Set per deployment, never tuned
while the app runs.

```ts
export const environment = defineEnvironment({
  DATABASE_URL: env.string({ description: 'The Postgres the app and tunables share.' }),
  TASKLANE_LOG_LEVEL: env.choice({ options: ['debug', 'info', 'warn', 'error'], default: 'info', description: 'How much the server logs.' })
})
```

[Deployment values](./deployment-values.md), declared once and written to
`.env.example`. A value is one or the other, never both, so there is no
precedence between the environment and the database.

## Testing

*A test that needs a workspace at its limit.* Your own definitions, in memory.

```ts
import { setForTest, testTunables } from 'tunables/testing'

const tunables = await testTunables({ groups, presets, catalogs, effects, scopes })
await setForTest(tunables, { limits: { maxProjects: 1 } })
```

[`tunables/testing`](./testing.md) syncs your definitions over a memory store;
`setForTest` puts values in place past the checks a person would meet.
