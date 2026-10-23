---
title: Catalogs
description: Lists of allowed choices, such as permitted models, whose entries are retired rather than deleted and cannot be retired while in use.
group: Concepts
order: 8
---

# Catalogs

A **catalog** is a list of allowed choices that presets and your app pick
from: the models a run may use, the regions a deployment may serve, the plans
a sale may offer. Each entry has an id, the same fields as every other entry,
and a state: **Available** or **Retired**. Entries are never deleted. An entry
something still uses cannot be retired.

## Declaring a catalog

```ts
import { choices, defineCatalog, number, text } from 'tunables'

export const models = defineCatalog({
  id: 'models',
  title: 'Models',
  singular: 'Model',
  description: 'The language models Run Configs may choose, with the efforts each takes and what it costs.',
  place: { label: 'Run Configs › Models', href: '/admin/run-configs/models' },
  idLabel: 'Model id',
  labelField: 'label',
  fields: {
    label: text({ label: 'Label', default: '', optional: false, maxLength: 80 }),
    efforts: choices({ label: 'Efforts', options: ['low', 'medium', 'high'], default: ['low', 'medium', 'high'], minimum: 0 }),
    inputRate: number({ label: 'Input rate', unit: 'dollars-per-million', integer: false, default: 0.15 }),
    contextWindowTokens: number({ label: 'Context window', unit: 'tokens', default: 131072 })
  },
  seed: [
    { id: 'openai/gpt-oss-120b', values: { label: 'GPT-OSS 120B (Groq)', efforts: ['low', 'medium', 'high'], inputRate: 0.15, contextWindowTokens: 131072 } }
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

A `pick` field on a preset names a catalog. It may hold the id of any of that
catalog's entries, and the screens offer only the Available ones.

```ts
model: pick({ label: 'Model', catalog: 'models', default: 'openai/gpt-oss-120b' })
```

A preset that already picks an entry keeps it when the entry is retired, and
can still be saved with it. It cannot newly pick a Retired entry: *"Model:
"openai/gpt-oss-20b" is retired; choose an Available model."*

## Working with entries

```ts
const models = tunables.catalog('models')

await models.add({ id: 'qwen/qwen3-32b', values: { label: 'Qwen3 32B', efforts: [], inputRate: 0.29, contextWindowTokens: 131072 } }, { actor })
await models.edit('qwen/qwen3-32b', { inputRate: 0.3 }, { actor, reason: 'New price' })
await models.retire('qwen/qwen3-32b', { actor })
await models.reinstate('qwen/qwen3-32b', { actor })

await models.available() // Available entries only
await models.usedBy('openai/gpt-oss-120b') // ['Run Config "Daily brief"', …]
```

- An id is required and has no spaces. It never changes.
- `edit` is refused when the change would make any preset fail its own
  `rules`: an entry cannot change under a preset that relies on it.
- Every add, edit, retire and reinstate is recorded as a revision of the entry.

## What uses an entry

`retire` is refused while anything uses the entry, and says what:

```
GPT-OSS 20B (Groq) is in use by Run Config "Daily brief", Run Config "Weekly brief"; move them to another model first.
```

Presets that pick the entry are found on their own. For what your app keeps,
such as a reader's own choice of model, register `uses`: a function per catalog
that returns the names of whatever uses an entry.

```ts
import type { UsesProvider } from 'tunables'

const readerModels: UsesProvider = async ({ entry }) => {
  const rows = await sql`select name from readers where model = ${entry}`
  return rows.map(row => `Reader "${row.name}"`)
}

createTunables({ store, groups, presets, catalogs: [models], units, uses: { models: readerModels } })
```

## On the screens

`TunablesCatalog` lists a catalog's entries with what uses each, and adds,
edits, retires and reinstates them. See [The Nuxt layer](./nuxt-layer.md).
