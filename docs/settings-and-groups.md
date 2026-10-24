---
title: Settings and groups
description: Declare each setting once, in a group edited beside what it affects, and read it with types.
group: Concepts
order: 4
---

# Settings and groups

A **setting** is a value someone tunes while the app runs: a limit, an
interval, a budget, a switch. A **group** is a set of settings edited together,
on one form, beside what they affect. Every setting belongs to exactly one
group. A group's values are stored as one row, with one more for each
workspace or person that [sets its own](./scopes.md).

## Declaring a group

```ts
import { defineEffects, defineGroup, number, range, toggle } from 'tunables'

export const effects = defineEffects({
  members: { label: 'What everyone in the workspace sees', icon: 'i-lucide-users' },
  cost: { label: 'AI cost', warn: true, icon: 'i-lucide-coins' }
})

export const limits = defineGroup({
  id: 'limits',
  title: 'Limits',
  description: 'How much a workspace may hold and use.',
  place: { label: 'Admin › Limits', href: '/admin/limits' },
  fields: {
    maxProjects: number({
      label: 'Projects',
      help: 'The most projects a workspace may have open at once.',
      unit: 'count',
      default: 3,
      section: 'What a workspace holds',
      affects: ['members']
    }),
    titleLength: range({
      label: 'Task title length',
      help: 'How short and how long a task\'s title may be.',
      unit: 'characters',
      default: { min: 1, max: 200 },
      section: 'What a workspace holds',
      affects: ['members']
    }),
    aiSuggestions: toggle({
      label: 'AI suggestions',
      help: 'Whether people may ask for suggested tasks.',
      default: true,
      section: 'AI',
      affects: ['members', 'cost']
    })
  }
})
```

A group says:

| Option | What it is |
| --- | --- |
| `id` | The group's stable name, used to read and store it. |
| `title`, `description` | How it reads on its form and in All settings. |
| `fields` | Its settings, by key. Keys are the names your code reads. |
| `place` | Where it is edited in your app, so All settings can link there. |
| `entity` | The pdd-kit Product Model Entity its fields are facts of. See [Explanations](#explanations). |
| `rules` | Checks between its own fields. See [Checks and guards](./checks-and-guards.md). |
| `confirm` | A question to answer before a costly change is saved. |

## What a field says

Every kind of field takes the same information about itself:

| Option | What it is |
| --- | --- |
| `default` | Its value until someone changes it. The one home of the default. |
| `label` | The name a person reads. Defaults to `fact`, then to the key. |
| `help` | An explanation in the product's words, shown beside the label. |
| `fact` | The Product Model fact the field is. Its explanation comes from there. |
| `section` | The sub-heading it is listed under within its group. |
| `affects` | What changing it changes, by effect id. |
| `override` | Where a workspace or a person may set its own value, and how far. See [Scopes](./scopes.md). |

Each kind adds its own options, such as a `number`'s `unit` and bounds; see
[Kinds and units](./kinds-and-units.md). `createTunables` refuses a definition
whose default does not pass its own check, whose unit or effect is not
declared, or whose `pick` names a catalog that does not exist. A mistake in a
definition fails at start, in words, not on someone's first save.

### Effects

`affects` names what changing a field changes, by the ids you declare with
`defineEffects`. Each effect has a `label`, an optional Iconify `icon`, and
`warn` for a change that costs money or reaches people. The screens show the
effects under each field, and All settings can filter by them.

### Sections

`section` groups a form's fields under sub-headings, in the order their first
field appears. Fields without one are listed first, under General.

## Reading values

`createTunables` takes your groups and returns typed reads:

```ts
const tunables = createTunables({ store, groups: [limits], effects })

const { maxProjects, titleLength } = await tunables.get('limits')
// maxProjects: number
// titleLength: { min: number, max: number }
```

- **Read at the point of use, every time.** A read is one query. A value
  captured at boot needs a restart to change.
- **Never write a fallback.** `get` returns every field or throws: a
  `?? 3` beside it would be a second home for the default.
- `get` throws `TunablesMissing` when the group, or one of its fields, has not
  been stored yet: run [`tunables sync`](./cli-values.md#sync).
- It throws `TunablesInvalid` when a stored value no longer passes its check,
  for example after its bounds were tightened.
- A long-running worker can pass `{ lastGood: true }`: when a read fails, it
  returns the last values this process read or saved, if it has any.
- With `scopes`, pass `{ scope: { workspace: 'acme', user: 'dana' } }` to
  read the values as that workspace and person get them, through their plan
  and their own overrides. See [Scopes](./scopes.md#reading-at-a-path).

To react to changes made in this process, subscribe:

```ts
const stop = tunables.onChange('limits', (values) => {
  suggestions.setEnabled(values.aiSuggestions)
})
```

The listener runs after a change to the group's system values commits. Other
processes learn of it on their next read.

### The entry

`tunables.entry(id)` returns what a form needs: the stored `values`, the
`defaults`, which keys are `changed` from their default, each value and default
as it reads to a person (`display`), `notes` from your
[notes provider](./checks-and-guards.md#notes), and who changed the group last
and when.

```ts
const entry = await tunables.entry('limits')
entry.display.values.titleLength // "1–200 characters"
entry.changed // ["maxProjects"] once it differs from its default
```

## Saving values

A save takes the fields that change, merges them over the stored values, and
checks the whole group before anything is written:

```ts
const outcome = await tunables.save('limits', { maxProjects: 5 }, {
  actor: { id: user.id, name: user.name },
  reason: 'More room on the free tier'
})

if (!outcome.saved) {
  for (const problem of outcome.problems) console.log(problem.key, problem.message)
}
```

The outcome says what the change came to. Nothing is stored unless `saved` is
true.

| Field | What it holds |
| --- | --- |
| `saved` | Whether the change was stored. |
| `problems` | Each problem in words, with the `key` of the field it is about when there is one. |
| `confirm` | Set when the change must be confirmed: send it again with `confirmed: true`. |
| `revision` | The revision recorded. Absent when nothing changed. |
| `value` | The group's entry after the save. |

The change options are the same everywhere:

| Option | What it is |
| --- | --- |
| `actor` | Who made the change: a name, or `{ id, name }`. Stored as the name. |
| `reason` | Why, kept on the revision. |
| `confirmed` | The change was sent again after it asked to be confirmed. |
| `host` | Your open transaction or request context, handed to guards and notes. |
| `scope` | Where the change is made, such as `{ workspace: 'acme' }`. Absent: the whole system. See [Scopes](./scopes.md#saving-at-a-scope). |

`reset` puts fields back at their defaults through the same checks:

```ts
await tunables.reset('limits', ['maxProjects'], { actor: 'Ada' })
await tunables.reset('limits') // every field
```

## Explanations

A field explains itself beside its label: the question mark on the form, the
help in All settings. When the field names a `fact` and its group names an
`entity`, the explanation is the Product Model's own description of that fact;
otherwise it is the field's `help`. With a [pdd-kit](https://pdd-kit.dev)
Product Model, write `fact` instead of `help`, run
[`tunables explain`](./cli-check.md#explain) and pass the module it writes to
`createTunables` as `explanations`. `tunables check` reports a field that
carries `help` for a fact the model describes, and a `fact` on a group that
names no `entity`. See [Check and generate](./cli-check.md#explain).

## Where a group goes

Put settings that bound one another in one group, because a group's `rules` see
only its own values. Otherwise group by what the settings govern and who tunes
them, and give each group a `place` beside what it affects: limits on the
admin's Limits page, how a workspace works on the workspace's own settings
page. All settings lists every group in one place, read-only, with a link to
each.
