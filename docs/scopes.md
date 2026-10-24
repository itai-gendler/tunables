---
title: Scopes
description: Values per workspace and per person, through layers — the system, a plan, the workspace, the person — each bounded by what it inherits.
group: Concepts
order: 9
---

# Scopes

Some settings need a different value for a part of your product: a workspace
that wants fewer projects than its plan allows, a person whose week starts on
Sunday. tunables keeps those values as **overrides** in the same tables, with
the same checks and the same history as the system's, and reads a value
through its **layers**: the system value, the plan the workspace is on, the
workspace's own value, the person's own value. The most specific layer that
holds a field wins, and every screen says where a value comes from.

The examples on this page are from [Tasklane](./tasklane-example.md), a todo
app with workspaces and the people in them.

## Declaring the chain

Your app names its scopes once, broadest first, when it creates tunables:

```ts
import { createTunables } from 'tunables'

export const tunables = createTunables({
  store,
  groups,
  presets,
  scopes: ['workspace', 'user'],
  scopeLabel: (scope, id) => names[`${scope}:${id}`] ?? `${scope} ${id}`
})
```

- `scopes` is the chain. A user sits inside a workspace, so a user's values
  are read on top of their workspace's. Without `scopes`, there are no layers.
- `scopeLabel` says how a scope reads to a person, in refusals and on the
  screens: *Acme* rather than `workspace=acme`. Without it, a scope reads as
  *Workspace acme*. It may be async, to look the name up.

A **scope path** names one place in the chain: `{ workspace: 'acme' }` or
`{ workspace: 'acme', user: 'dana' }`. A path names a prefix of the chain, so
it cannot name a user without their workspace. Ids may not be empty or hold
`=` or `;`.

## Declaring what may be overridden

Nothing is overridable unless its field says so. `override` names the scopes
that may set their own value:

```ts
export const workspace = defineGroup({
  id: 'workspace',
  title: 'Workspace',
  fields: {
    defaultView: choice({ label: 'Default view', options: ['list', 'board', 'calendar'], default: 'list', override: ['workspace', 'user'] }),
    reminderHour: number({ label: 'Reminder time', unit: 'hour', default: 9, override: ['user'] }),
    guestAccess: toggle({ label: 'Guests', default: false, override: ['workspace'] }),
    suggestionModel: pick({ label: 'Suggestion model', catalog: 'models', default: 'small' })
  }
})
```

A list overrides freely: a workspace may pick any default view its kind
allows. A field with no `override`, such as `suggestionModel`, is set only for
the whole system.

### Bounds

A number can instead say, per scope, how its override relates to the value it
inherits:

```ts
export const limits = defineGroup({
  id: 'limits',
  title: 'Limits',
  fields: {
    maxProjects: number({ label: 'Projects', unit: 'count', default: 3, override: { workspace: 'at-most' } }),
    aiSuggestionsPerDay: number({ label: 'AI suggestions a day', unit: 'count', default: 20, min: 0, override: { workspace: 'at-most', user: 'at-most' } })
  }
})
```

| Rule | The override may be |
| --- | --- |
| `'free'` | anything its kind allows |
| `'at-most'` | no more than the value it inherits |
| `'at-least'` | no less than the value it inherits |

Acme's owner may lower *Projects* below what Acme's plan allows, never raise
it. Dana may lower her own *AI suggestions a day* below Acme's, never raise
it. `at-most` and `at-least` apply to `number` fields only; `createTunables`
refuses them on another kind, and refuses an `override` that names a scope not
in the chain.

## Plans as a layer

A [preset set](./presets.md) can be a layer of a group. Tasklane's plans hold
the limits a workspace gets on Free, Pro and Team:

```ts
export const plans = definePresets({
  id: 'plans',
  title: 'Plans',
  singular: 'Plan',
  slots: ['plan'],
  layer: { group: 'limits', scope: 'workspace' },
  fields: {
    maxProjects: number({ label: 'Projects', unit: 'count', default: 3 }),
    aiSuggestionsPerDay: number({ label: 'AI suggestions a day', unit: 'count', default: 20, min: 0 })
  },
  seed: [
    { key: 'free', slot: 'plan', label: 'Free', values: { maxProjects: 3, aiSuggestionsPerDay: 5 } },
    { key: 'pro', slot: 'plan', label: 'Pro', values: { maxProjects: 50, aiSuggestionsPerDay: 100 } },
    { key: 'team', slot: 'plan', label: 'Team', values: { maxProjects: 500, aiSuggestionsPerDay: 500 } }
  ]
})
```

`layer: { group, scope, slot? }` puts the set between the system value and
that scope's own. For a workspace, the plan it is
[assigned](./presets.md#assigning-by-reference) in the slot (the set's first
slot unless `slot` says otherwise) applies, or the slot's default when it is
assigned none. Its fields must be fields of the group, of the same kinds. A
plan sets them freely; the set's own `rules` and `within` still apply.

So the layers of *Projects* for Dana, with Acme on Pro, are:

| Layer | Holds | Projects |
| --- | --- | --- |
| System | the `limits` group | 3 |
| Plan | Pro, assigned to Acme | 50 |
| Workspace | Acme's own override | 20 |
| User | Dana may not set Projects | |

Dana reads 20.

## Reading at a path

Pass the path to `get`. It returns every field, as read through the layers:

```ts
const limits = await tunables.get('limits', { scope: { workspace: 'acme', user: 'dana' } })
if (openProjects >= limits.maxProjects) throw new Error(`Your workspace may have ${limits.maxProjects} open projects.`)
```

Without a path, `get` returns the system's values, as before.
`{ lastGood: true }` works at a path too.

`entry(id, { scope })` returns what a scoped form needs. Beside `values`, it
has `scope` (`{ key, path, label }`) and `layers`, one per field this scope
may set:

```ts
const entry = await tunables.entry('limits', { scope: { workspace: 'acme' } })
entry.layers.maxProjects
// { inherited: 50, inheritedDisplay: '50', from: 'plan:plans:pro', fromLabel: 'Pro plan', overridden: true, rule: 'at-most' }
```

`from` is `system`, `plan:<set>:<key>`, or a scope key such as
`workspace=acme`; `fromLabel` is how that reads. `overridden` says whether
this scope sets its own value. `changed` lists the fields it overrides.

## Saving at a scope

`save`, `reset` and `restore` take the path in `scope`. The most specific
scope in it is where the change is made:

```ts
await tunables.save('limits', { maxProjects: 20 }, {
  scope: { workspace: 'acme' },
  actor: { id: 'olivia', name: 'Olivia' },
  reason: 'Keep Acme small while it trials'
})
```

- A scope stores only the fields it overrides. The rest it inherits.
- `null` stops overriding a field: the scope uses the inherited value again.
  `reset(id, keys?, { scope })` does the same for the keys given, or for every
  field the scope may set. A scope with nothing left keeps no row.
- The group's `rules` run on the values as read at the path after the change.
  Guards receive the path as `scope`, and `confirm` compares the values as
  read there before and after: turning on *Guests* for Acme asks first, as it
  does for the system.

### Refusals

A scoped save is refused, naming the field, when:

- the field cannot be set at that scope:
  *"Projects cannot be set for Dana."*;
- the value is outside its bound:
  *"Projects may be at most 50 for Acme, the value it inherits."*;
- it would leave a narrower override outside its own bound:
  *"Dana keeps AI suggestions a day at 3, above 2."*;
- it would break the group's rules for a narrower scope that overrides
  something, as that scope reads its values:
  *"For Dana: Due soon may not be longer than the time before done tasks are
  archived."* A rule that was already broken there is not blamed on this
  change.

A field that stops being overridable at a scope (its `override` no longer
names it) reads as inherited there at once. Its stored value is dropped on the
scope's next save, or cleared with `null`.

That last check runs on every broader change, so a value is never lowered
under someone who already relies on it. Lowering the system value, editing a
plan, moving a workspace to another plan, or lowering a workspace's own value
is refused while an override below would end up outside its bound:

```
Plan "Pro": Acme keeps Projects at 20, above 10.
Acme keeps Projects at 20, above 3.
```

The first is an edit of the Pro plan; the second, moving Acme to Free. Lower
or clear the override first, then make the broader change.

## History and restore at a scope

Each scoped change records one revision on its target,
`{ kind: 'group', name: 'limits', id: 'workspace=acme' }`, with only the
fields that scope set:

```ts
await tunables.history({ kind: 'group', name: 'limits', id: 'workspace=acme' })
```

Restoring a scope's revision puts that scope's own values back exactly as they
were: what it set then, it sets again; what it did not set, it inherits again.
It runs through every check, as any save does. A group's history without an
`id` is the system's.

## The scoped screen

[`TunablesGroupForm`](./nuxt-layer.md#tunablesgroupform) takes a `scope`:

```vue [app/pages/workspace.vue]
<template>
  <TunablesGroupForm group="limits" :scope="{ workspace: 'acme' }" />
</template>
```

It shows only the fields that scope may set, with a badge naming the scope.
Each field says where its value comes from: *Inherited from Pro plan*, or
*Set here · inherits 50 from Pro plan*, with its bound (*At most 50*) and a
*Use 50 from Pro plan* button. Its history panel shows that scope's revisions.
A scope that may set nothing in the group says so.

A screen like this is for the workspace's owner, or for the person
themselves, so your `authorize` has to let them reach it. See
[Who can do what](./access.md#self-service-per-scope).

## From the terminal

`get`, `set` and `history` take `--scope`, written as `scope=id` pairs
separated by commas:

```bash
npx tunables get limits --scope workspace=acme
npx tunables set limits maxProjects=20 --scope workspace=acme --reason "Keep Acme small while it trials"
npx tunables set limits --scope workspace=acme --inherit aiSuggestionsPerDay --reason "Back to the plan"
npx tunables history limits --scope workspace=acme
```

```
maxProjects          20  (set here; inherits 50 from Pro plan)
maxTasksPerProject   5,000  (from Pro plan)
attachmentMb         100 MB  (from Pro plan)
aiSuggestionsPerDay  100  (from Pro plan)
```

`--inherit` takes comma-separated keys to stop overriding. See
[Read and change values](./cli-values.md).

## Where the rows go

A group's system row has scope `''` and holds every field; a scoped row holds
only what it overrides, keyed by `(id, scope)`. `sync` seeds system rows only.
See [Storage](./storage.md#the-tables). The contract is
[`spec/scopes.md`](https://github.com/itai-gendler/tunables/blob/main/spec/scopes.md).
