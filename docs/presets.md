---
title: Presets
description: Named, reusable configurations with one default per slot, assigned by reference and bounded by the settings.
group: Concepts
order: 7
---

# Presets

A **preset set** holds named configurations that subjects follow: plans that
accounts are on, run configurations for a daily and a weekly cadence, limits
for a tier. Each preset has the same fields, declared once, and each fills a
**slot**. Every slot has exactly one **default**. A subject follows the
default for a slot, or is assigned a preset by its key, never given a copy.
Edit a preset and everyone who follows it gets the change.

## Declaring a preset set

```ts
import { choice, createTunables, definePresets, number, pick, text } from 'tunables'

export const runConfigs = definePresets({
  id: 'run-configs',
  title: 'Run Configs',
  singular: 'Run Config',
  description: 'How Briefs of one cadence are run, and what they may spend.',
  place: { label: 'Run Configs', href: '/admin/run-configs' },
  slots: ['daily', 'weekly'],
  fields: {
    lookbackHours: number({ label: 'Window', unit: 'hours', default: 24, section: 'Product' }),
    maxStories: number({ label: 'Story ceiling', unit: 'count', default: 10, section: 'Product' }),
    instructions: text({ label: 'Framing', default: '', maxLength: 4000, multiline: true, section: 'Product' }),
    model: pick({ label: 'Model', catalog: 'models', default: 'openai/gpt-oss-120b', section: 'Cost' }),
    effort: choice({ label: 'Effort', options: ['low', 'medium', 'high'], default: 'high', section: 'Cost' }),
    maxBudgetUsd: number({ label: 'Budget', unit: 'dollars', integer: false, default: 0.1, section: 'Cost' })
  },
  rules: (values, catalogs) => {
    const model = catalogs.entry('models', values.model)
    const efforts = (model?.values.efforts ?? []) as string[]
    return efforts.includes(values.effort)
      ? []
      : [{ key: 'effort', message: `${String(model?.values.label)} does not take effort "${values.effort}".` }]
  },
  within: (values, settings) => {
    const limits = settings.get('run') as { budgetLimitUsd: number, storyLimit: number }
    const problems: string[] = []
    if (values.maxBudgetUsd > limits.budgetLimitUsd) problems.push(`its Budget is above the Budget limit of $${limits.budgetLimitUsd}.`)
    if (values.maxStories > limits.storyLimit) problems.push(`its Story ceiling, ${values.maxStories}, is above the Story limit of ${limits.storyLimit}.`)
    return problems
  },
  seed: [
    { key: 'daily', slot: 'daily', label: 'Daily brief' },
    { key: 'weekly', slot: 'weekly', label: 'Weekly brief', values: { lookbackHours: 168, maxStories: 15 } }
  ]
})

createTunables({ store, groups, presets: [runConfigs], catalogs: [models] })
```

| Option | What it is |
| --- | --- |
| `title`, `singular` | The set and one of them: "Run Configs", "Run Config". |
| `slots` | What a preset fills. Each slot has exactly one default. |
| `fields` | Each preset's fields, declared like a group's. |
| `rules` | Checks between one preset's fields, or against a catalog entry it picks. |
| `within` | How the settings bound a preset. |
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
  Run Config "Weekly brief": its Story ceiling, 15, is above the Story limit of 12.
  ```

To lower the limit, first edit or remove the preset in the way. A limit never
drops below what uses it.

## Rules and catalogs

A preset's `rules(values, catalogs)` checks its own fields together, and can
read the [catalog](./catalogs.md) entries it picks through
`catalogs.entry(catalogId, entryId)`, as they would be after the change. The
`rules` above refuse an effort the picked model does not take, beside the
Effort field.

Before `rules` runs, every `pick` is checked: it must name an entry of its
catalog, and that entry must be Available, unless the preset already picked it
before this change. Editing a catalog entry runs every preset's `rules` again,
so an entry cannot change under a preset in a way that preset would refuse.

## Working with presets

`tunables.presets(id)` returns the set's operations. Each change is checked,
locked and recorded as a revision, like a group save.

```ts
const runConfigs = tunables.presets('run-configs')

await runConfigs.create({ key: 'daily-light', slot: 'daily', label: 'Daily, light', values: { maxStories: 6 } }, { actor })
await runConfigs.update('daily-light', { values: { maxBudgetUsd: 0.05 } }, { actor, reason: 'Cheaper model' })
await runConfigs.makeDefault('daily-light', { actor })
await runConfigs.remove('daily', { actor })
await runConfigs.list()
```

- A key is lowercase letters, digits and single hyphens, such as `daily-light`,
  and never changes. The label can.
- A new preset starts from the field defaults, overlaid with the values you
  give. The first preset in a slot becomes its default.
- `makeDefault` moves the slot's default to this preset.
- The default of a slot cannot be removed; make another the default first.
  Removing a preset returns every subject assigned to it to the default.

## Assigning by reference

A subject is whatever your app assigns presets to: a reader, an account, a
team. It is identified by your own id; tunables never stores anything else
about it.

```ts
await runConfigs.assign('reader-42', 'daily', 'daily-light', { actor }) // assign
await runConfigs.assign('reader-42', 'daily', null, { actor }) // follow the default again
await runConfigs.assignments('reader-42')
```

When work runs, resolve the preset for the subject and slot, and keep its key
with what it produced:

```ts
const config = await runConfigs.resolve('reader-42', 'daily')
// { key: 'daily-light', label: 'Daily, light', assigned: true, values: { … }, resolvedAt: '…' }
```

`resolve` returns the subject's assignment, or the slot's default when there
is none (`assigned: false`). Its `values` include defaults for fields the
preset was stored without.

## Seeding

`sync` makes sure every slot has a default. For a slot without one, it creates
the presets `seed` lists for that slot (the first becomes the default), or,
without a seed, one preset per slot keyed by the slot, labelled after it, at
the field defaults.

## On the screens

`TunablesPresets` lists a set by slot, with each preset's default and how many
are assigned it, and creates, edits, defaults and removes them.
`TunablesAssign` picks the preset one subject follows for one slot. See
[The Nuxt layer](./nuxt-layer.md).
