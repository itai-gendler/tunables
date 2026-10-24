---
title: Catalogs
description: Lists of allowed choices, such as permitted models, whose entries are retired rather than deleted and cannot be retired while in use.
group: Concepts
order: 10
---

# Catalogs

A **catalog** is a list of allowed choices that settings, presets and your
app pick from: the models that may draft suggestions, the regions a deployment
may serve, the add-ons a sale may offer. Each entry has an id, the same fields as every other entry,
and a state: **Available** or **Retired**. Entries are never deleted. An entry
something still uses cannot be retired.

## Declaring a catalog

```ts
import { defineCatalog, number, text } from 'tunables'

export const models = defineCatalog({
  id: 'models',
  title: 'Models',
  singular: 'Model',
  description: 'The models that may draft task suggestions, and what one suggestion costs.',
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

| Option | What it is |
| --- | --- |
| `title`, `singular` | The catalog and one of its entries: "Models", "Model". |
| `idLabel` | What an entry's id is called on the screens. Defaults to "Id". |
| `labelField` | The field that names an entry to a person. Defaults to its id. |
| `fields` | Each entry's fields. |
| `rules` | Checks between one entry's fields. |
| `seed` | The entries `sync` adds when the catalog is empty. |

A catalog's field defaults are what a new entry's form starts from; unlike a
group's, they need not pass on their own, because an entry is always given its
values.

## Picking from a catalog

A `pick` field, on a group or a preset, names a catalog. It may hold the id of
any of that catalog's entries, and the screens offer only the Available ones.

```ts
suggestionModel: pick({ label: 'Suggestion model', catalog: 'models', default: 'small' })
```

A setting or preset that already picks an entry keeps it when the entry is
retired, and can still be saved with it. It cannot newly pick a Retired entry:
*"Suggestion model: "large" is retired; choose an Available model."*

## Working with entries

```ts
const models = tunables.catalog('models')

await models.add({ id: 'medium', values: { label: 'Medium', centsPerSuggestion: 2 } }, { actor })
await models.edit('medium', { centsPerSuggestion: 3 }, { actor, reason: 'New price' })
await models.retire('medium', { actor })
await models.reinstate('medium', { actor })

await models.available() // Available entries only
await models.usedBy('small') // ['Workspace › Suggestion model', …]
```

- An id is required and has no spaces. It never changes.
- `edit` is refused when the change would make any preset fail its own
  `rules`: an entry cannot change under a preset that relies on it.
- Every add, edit, retire and reinstate is recorded as a revision of the entry.

## What uses an entry

`retire` is refused while anything uses the entry, and says what:

```
Small and quick is in use by Workspace › Suggestion model; move them to another model first.
```

What tunables keeps is found on its own: a setting that picks the entry, for
the whole system or at any [scope](./scopes.md) (*"Workspace › Suggestion
model for Acme"*), and a preset that picks it (*Plan "Team"*). For what your
app keeps, such as a project's own choice of model, register `uses`: a
function per catalog that returns the names of whatever uses an entry.

```ts
import type { UsesProvider } from 'tunables'

const projectModels: UsesProvider = async ({ entry }) => {
  const rows = await sql`select name from projects where suggestion_model = ${entry}`
  return rows.map(row => `Project "${row.name}"`)
}

createTunables({ store, groups, presets, catalogs: [models], uses: { models: projectModels } })
```

## On the screens

`TunablesCatalog` lists a catalog's entries with what uses each, and adds,
edits, retires and reinstates them. See [The Nuxt layer](./nuxt-layer.md).
