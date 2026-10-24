---
title: Presets
description: Named, reusable configurations with one default per slot, assigned by reference and bounded by the settings.
group: Concepts
order: 8
---

# Presets

A **preset set** holds named configurations that subjects follow: the plans
workspaces are on, configurations for a daily and a weekly job, limits for a
tier. Each preset has the same fields, declared once, and each fills a
**slot**. Every slot has exactly one **default**. A subject follows the
default for a slot, or is assigned a preset by its key, never given a copy.
Edit a preset and everyone who follows it gets the change.

## Declaring a preset set

```ts
import { createTunables, definePresets, number, pick } from 'tunables'

export const plans = definePresets({
  id: 'plans',
  title: 'Plans',
  singular: 'Plan',
  description: 'What a workspace may hold and spend on each plan.',
  place: { label: 'Admin › Plans', href: '/admin/plans' },
  slots: ['plan'],
  fields: {
    maxProjects: number({ label: 'Projects', unit: 'count', default: 3 }),
    aiSuggestionsPerDay: number({ label: 'AI suggestions a day', unit: 'count', default: 5, min: 0 }),
    aiCentsPerDay: number({ label: 'AI budget a day', unit: 'count', default: 10, min: 0 }),
    suggestionModel: pick({ label: 'Suggestion model', catalog: 'models', default: 'small' })
  },
  rules: (values, catalogs) => {
    const model = catalogs.entry('models', values.suggestionModel)
    const cents = Number(model?.values.centsPerSuggestion ?? 0) * values.aiSuggestionsPerDay
    return cents > values.aiCentsPerDay
      ? [{ key: 'aiSuggestionsPerDay', message: `${values.aiSuggestionsPerDay} suggestions a day on ${String(model?.values.label)} cost ${cents} cents, above the AI budget of ${values.aiCentsPerDay}.` }]
      : []
  },
  within: (values, settings) => {
    const { projectCeiling } = settings.get('ceilings') as { projectCeiling: number }
    return values.maxProjects > projectCeiling
      ? [`its Projects, ${values.maxProjects}, is above the ceiling of ${projectCeiling}.`]
      : []
  },
  seed: [
    { key: 'free', slot: 'plan', label: 'Free' },
    { key: 'pro', slot: 'plan', label: 'Pro', values: { maxProjects: 50, aiSuggestionsPerDay: 100, aiCentsPerDay: 500 } },
    { key: 'team', slot: 'plan', label: 'Team', values: { maxProjects: 500, aiSuggestionsPerDay: 500, aiCentsPerDay: 2500, suggestionModel: 'large' } }
  ]
})

createTunables({ store, groups, presets: [plans], catalogs: [models] })
```

| Option | What it is |
| --- | --- |
| `title`, `singular` | The set and one of them: "Plans", "Plan". |
| `slots` | What a preset fills. Each slot has exactly one default. |
| `fields` | Each preset's fields, declared like a group's. |
| `rules` | Checks between one preset's fields, or against a catalog entry it picks. |
| `within` | How the settings bound a preset. |
| `layer` | Makes the set a layer of a group at a scope, so a workspace reads its plan's values. See [Plans as a layer](#plans-as-a-layer). |
| `seed` | The presets `sync` creates for a slot that has no default. |

## Within

`within(values, settings)` reads the settings through `settings.get(groupId)`,
as they would be after the change being checked, and returns its problems. It
runs in two places:

- **When a preset is saved.** A preset above a limit cannot be created or
  edited.
- **When any group is saved**, against every stored preset. Lowering a limit
  below a preset is refused, and each problem names the preset in front of
  your sentence:

  ```
  Plan "Team": its Projects, 500, is above the ceiling of 400.
  ```

To lower the limit, first edit or remove the preset in the way. A limit never
drops below what uses it.

## Rules and catalogs

A preset's `rules(values, catalogs)` checks its own fields together, and can
read the [catalog](./catalogs.md) entries it picks through
`catalogs.entry(catalogId, entryId)`, as they would be after the change. The
`rules` above refuse more suggestions a day than the plan's AI budget pays
for on the model it picks, beside the AI suggestions field.

Before `rules` runs, every `pick` is checked: it must name an entry of its
catalog, and that entry must be Available, unless the preset already picked it
before this change. Editing a catalog entry runs every preset's `rules` again,
so an entry cannot change under a preset in a way that preset would refuse.

## Working with presets

`tunables.presets(id)` returns the set's operations. Each change is checked,
locked and recorded as a revision, like a group save.

```ts
const plans = tunables.presets('plans')

await plans.create({ key: 'starter', slot: 'plan', label: 'Starter', values: { maxProjects: 10 } }, { actor })
await plans.update('starter', { values: { aiSuggestionsPerDay: 20 } }, { actor, reason: 'Launch offer' })
await plans.makeDefault('starter', { actor })
await plans.remove('free', { actor })
await plans.list()
```

- A key is lowercase letters, digits and single hyphens, such as `team-2026`,
  and never changes. The label can.
- A new preset starts from the field defaults, overlaid with the values you
  give. The first preset in a slot becomes its default.
- `makeDefault` moves the slot's default to this preset.
- The default of a slot cannot be removed; make another the default first.
  Removing a preset returns every subject assigned to it to the default.

## Assigning by reference

A subject is whatever your app assigns presets to: a workspace, an account, a
person. It is identified by your own id; tunables never stores anything else
about it.

```ts
await plans.assign('acme', 'plan', 'pro', { actor }) // assign
await plans.assign('acme', 'plan', null, { actor }) // follow the default again
await plans.assignments('acme')
```

When work runs, resolve the preset for the subject and slot, and keep its key
with what it produced:

```ts
const plan = await plans.resolve('acme', 'plan')
// { key: 'pro', label: 'Pro', assigned: true, values: { … }, resolvedAt: '…' }
```

`resolve` returns the subject's assignment, or the slot's default when there
is none (`assigned: false`). Its `values` include defaults for fields the
preset was stored without.

## Plans as a layer

A preset set can instead be read as a layer of a group, so code that reads the
group at a workspace gets its plan's values without resolving anything:

```ts
definePresets({
  id: 'plans',
  slots: ['plan'],
  layer: { group: 'limits', scope: 'workspace' },
  fields: { maxProjects: number({ label: 'Projects', unit: 'count', default: 3 }) }
  // …
})

await tunables.get('limits', { scope: { workspace: 'acme' } }) // Pro's Projects, unless Acme sets its own
```

The set's fields must be fields of the group, of the same kinds. The plan a
workspace is assigned in `slot` (the first slot by default), or the slot's
default, sits between the system values and the workspace's own. Editing a
plan, or assigning another, is refused while a workspace's own value would end
up outside its bound. See [Scopes](./scopes.md#plans-as-a-layer).

## Seeding

`sync` makes sure every slot has a default. For a slot without one, it creates
the presets `seed` lists for that slot (the first becomes the default), or,
without a seed, one preset per slot keyed by the slot, labelled after it, at
the field defaults. A field newly declared on the set is added to every stored
preset at its default, so a stored preset never lacks one.

## On the screens

`TunablesPresets` lists a set by slot, with each preset's default and how many
are assigned it, and creates, edits, defaults and removes them.
`TunablesAssign` picks the preset one subject follows for one slot, such as a
workspace's plan. See
[The Nuxt layer](./nuxt-layer.md).
