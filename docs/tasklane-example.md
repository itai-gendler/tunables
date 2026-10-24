---
title: Tasklane, the example app
description: A todo app with workspaces and people as tunables — two groups, plans as a layer, a catalog of models, scopes, a rule, a confirmation, and the playground that runs it.
group: Reference
order: 28
---

# Tasklane, the example app

**Tasklane** is a todo app: workspaces hold projects, projects hold tasks, and
an AI model can suggest tasks. Its staff tune the system and the plans; each
workspace's owner sets their workspace's own values within what its plan
allows; each person sets their own preferences. It is small, and it uses
nearly everything tunables has.

Its definitions are
[`examples/tasklane/tunables.ts`](https://github.com/itai-gendler/tunables/blob/main/examples/tasklane/tunables.ts),
its access policy
[`examples/tasklane/access.ts`](https://github.com/itai-gendler/tunables/blob/main/examples/tasklane/access.ts),
and its CLI config
[`examples/tasklane/tunables.config.ts`](https://github.com/itai-gendler/tunables/blob/main/examples/tasklane/tunables.config.ts).
The docs, the playground, the server examples and the scoped tests use it.

| What | Holds |
| --- | --- |
| Limits | 4 settings: how much a workspace may hold and use, bounded by its plan |
| Workspace | 7 settings: how a workspace works, some per workspace, some per person |
| Plans | Presets for the `plan` slot: Free, Pro and Team, a layer of Limits at the workspace |
| Models | A catalog of the models that may draft task suggestions |
| Scopes | `workspace`, then `user` |

## Effects and scopes

```ts
export const effects = defineEffects({
  members: { label: 'What everyone in the workspace sees', icon: 'i-lucide-users' },
  person: { label: 'Only this person', icon: 'i-lucide-user' },
  storage: { label: 'Storage the workspace uses', icon: 'i-lucide-hard-drive' },
  cost: { label: 'AI cost', warn: true, icon: 'i-lucide-coins' }
})

export const scopes = ['workspace', 'user'] as const

export const scopeLabel = (scope: string, id: string) => names[`${scope}:${id}`] ?? `${scope} ${id}`
```

`names` maps `workspace:acme` to *Acme* and `user:dana` to *Dana*, so a
refusal says *"Acme keeps Projects at 20, above 10."* rather than naming keys.
A real app would look the names up.

## Limits

How much a workspace may hold. Each limit may be lowered by a workspace, never
raised; *AI suggestions a day* may be lowered by a person, too.

```ts
export const limits = defineGroup({
  id: 'limits',
  title: 'Limits',
  place: { label: 'Admin › Limits', href: '/admin/limits' },
  fields: {
    maxProjects: number({ label: 'Projects', unit: 'count', default: 3, max: 10000, affects: ['members'], override: { workspace: 'at-most' } }),
    maxTasksPerProject: number({ label: 'Tasks per project', unit: 'count', default: 200, max: 100000, affects: ['members'], override: { workspace: 'at-most' } }),
    attachmentMb: number({ label: 'Attachment size', unit: 'megabytes', default: 10, max: 2048, affects: ['storage'], override: { workspace: 'at-most' } }),
    aiSuggestionsPerDay: number({ label: 'AI suggestions a day', unit: 'count', default: 20, min: 0, max: 10000, affects: ['cost'], override: { workspace: 'at-most', user: 'at-most' } })
  }
})
```

The system values are what a workspace gets when no plan says otherwise.

## Plans: presets as a layer

Free, Pro and Team hold the same four limits. Because the set is a `layer` of
Limits at `workspace`, a workspace's plan sits between the system values and
the workspace's own:

```ts
export const plans = definePresets({
  id: 'plans',
  title: 'Plans',
  singular: 'Plan',
  place: { label: 'Admin › Plans', href: '/admin/plans' },
  slots: ['plan'],
  layer: { group: 'limits', scope: 'workspace' },
  fields: { /* the four limits */ },
  seed: [
    { key: 'free', slot: 'plan', label: 'Free', values: { maxProjects: 3, maxTasksPerProject: 200, attachmentMb: 10, aiSuggestionsPerDay: 5 } },
    { key: 'pro', slot: 'plan', label: 'Pro', values: { maxProjects: 50, maxTasksPerProject: 5000, attachmentMb: 100, aiSuggestionsPerDay: 100 } },
    { key: 'team', slot: 'plan', label: 'Team', values: { maxProjects: 500, maxTasksPerProject: 20000, attachmentMb: 500, aiSuggestionsPerDay: 500 } }
  ]
})
```

Free is the first seeded, so it is the slot's default: a workspace assigned no
plan is on Free. Acme is assigned Pro:

```ts
await tunables.presets('plans').assign('acme', 'plan', 'pro', { actor: 'Sam' })
```

Editing a plan, or moving a workspace to another one, is refused while it
would leave a workspace's own lower limit above the new value:
*"Plan "Pro": Acme keeps Projects at 20, above 10."*

## Workspace

How a workspace works for everyone in it. The owner sets most of these for
the workspace; each person may set their own view and week; only a person
sets their reminder time; only staff choose the model.

```ts
export const workspace = defineGroup({
  id: 'workspace',
  title: 'Workspace',
  place: { label: 'Workspace settings', href: '/workspace' },
  fields: {
    defaultView: choice({ label: 'Default view', options: [/* list, board, calendar */], default: 'list', override: ['workspace', 'user'] }),
    weekStartsOn: number({ label: 'Week starts on', unit: 'weekday', default: 1, override: ['workspace', 'user'] }),
    dueSoonDays: number({ label: 'Due soon', unit: 'days', default: 2, max: 30, override: ['workspace', 'user'] }),
    reminderHour: number({ label: 'Reminder time', unit: 'hour', default: 9, override: ['user'] }),
    archiveAfterDays: number({ label: 'Archive done tasks after', unit: 'days', default: 30, max: 365, override: ['workspace'] }),
    guestAccess: toggle({ label: 'Guests', default: false, override: ['workspace'] }),
    suggestionModel: pick({ label: 'Suggestion model', catalog: 'models', default: 'small' })
  },
  rules: values => values.dueSoonDays > values.archiveAfterDays
    ? [{ key: 'dueSoonDays', message: 'Due soon may not be longer than the time before done tasks are archived.' }]
    : [],
  confirm: (next, previous) => next.guestAccess && !previous.guestAccess
    ? 'Guests will see every task in the project they are invited to, including its comments and attachments.'
    : undefined
})
```

- **The rule** runs on the values as read where the change is made. If Acme
  archives done tasks after 7 days and Dana sets *Due soon* to 10, her save is
  refused: what she would read no longer holds together.
- **The confirmation** asks before Guests is turned on, for the system or for
  one workspace, and saves only when the change is sent again confirmed.

## Models: a catalog

The models that may draft task suggestions, each with what one suggestion
costs:

```ts
export const models = defineCatalog({
  id: 'models',
  title: 'Models',
  singular: 'Model',
  place: { label: 'Admin › Models', href: '/admin/models' },
  idLabel: 'Model id',
  labelField: 'label',
  fields: {
    label: text({ label: 'Label', default: '', optional: false, maxLength: 80 }),
    centsPerSuggestion: number({ label: 'Cost a suggestion', unit: 'count', default: 1, affects: ['cost'] })
  },
  seed: [
    { id: 'small', values: { label: 'Small and quick', centsPerSuggestion: 1 } },
    { id: 'large', values: { label: 'Large and careful', centsPerSuggestion: 5 } }
  ]
})
```

*Suggestion model* picks from it, so the model the system uses cannot be
retired: *"Small and quick is in use by Workspace › Suggestion model; move
them to another model first."*

## Reading in the app

Tasklane's own routes read the values for the person asking, at their scope:

```ts
const scope = { workspace: person.workspace, user: person.id }
const { maxProjects } = await tunables.get('limits', { scope })
const { weekStartsOn, defaultView } = await tunables.get('workspace', { scope })
```

For Dana, in Acme on Pro, *Projects* reads 50 until Acme lowers it, and *Week
starts on* reads Monday until Acme or Dana sets another day.

## The playground

The repository's `playground/` is Tasklane as a Nuxt app. It nests tunables in
its own oRPC router, puts the layer's components on Tasklane's pages, and
starts with Acme on Pro and Hobby club on the default plan. A switcher in the
header signs in as one of three people:

| Who | Sees |
| --- | --- |
| Sam, Tasklane staff | `/admin/limits`, `/admin/defaults` (Workspace for the system), `/admin/plans`, `/admin/workspaces` (each workspace's plan), `/admin/models`, `/admin/settings` (All settings) |
| Olivia, owns Acme | `/workspace`: Workspace and Limits at `{ workspace: 'acme' }` |
| Dana, member of Acme | `/me`: her own Workspace preferences and AI suggestions at `{ workspace: 'acme', user: 'dana' }` |

Its `authorize` lets Sam do anything, and each of the others only their own
scope; see [Who can do what](./access.md). From a checkout:

```bash
pnpm install
pnpm --dir playground dev
```

It runs in memory, or on Postgres when `DATABASE_URL` is set.

## The server examples

The same app on two other servers, each with a route of its own that reads
the values for the person asking:

- [`examples/express`](https://github.com/itai-gendler/tunables/tree/main/examples/express)
  mounts `tunablesMiddleware`; its `POST /projects` refuses a project past
  the person's *Projects* limit. Run `npx jiti examples/express/server.ts`
  (port 3300).
- [`examples/hono`](https://github.com/itai-gendler/tunables/tree/main/examples/hono)
  mounts `createHandler`; its `GET /me/calendar` answers the person's own
  week and view. Run `npx jiti examples/hono/server.ts` (port 3301).

Send an `x-person` header of `sam`, `olivia` or `dana` in place of a session.

## From the terminal

`examples/tasklane/tunables.config.ts` gives the CLI Tasklane's tunables, on
Postgres when `DATABASE_URL` is set:

```bash
npx tunables --cwd examples/tasklane sync
npx tunables --cwd examples/tasklane get limits --scope workspace=acme
npx tunables --cwd examples/tasklane set workspace reminderHour=7 --scope workspace=acme,user=dana --reason "Dana starts early"
```
