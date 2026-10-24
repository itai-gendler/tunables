---
title: Check and generate
description: The commands that need no database — checking definitions, writing .env.example, and keeping explanations and defaults in step with a pdd-kit Product Model.
group: CLI
order: 20
---

# Check and generate: check, env, explain, model draft

These commands read only your definitions, your files and your Product Model.
They need no database, so they run in CI, in a pre-commit hook and in an agent's
sandbox.

## check

```bash
npx tunables check
```

Checks, without a database, everything that must hold:

- **The definitions are sound**: no id defined twice, every unit and effect
  declared, every `pick` naming a catalog, every preset set with a slot, and
  every group and preset default passing its own check.
- **`.env.example` lists every deployment value** as declared, when the config
  has an `environment`.
- **The explanations module is up to date** with the Product Model, when the
  config names `explanations`.
- **Every field agrees with the Product Model**, when there is one: the Entity
  a group names exists, the fact each field names is one that Entity keeps,
  and a default the model states is the field's own.

```
✓ 2 groups, 1 preset sets and 1 catalogs are defined soundly
✓ env.example lists all 3 deployment values
✓ explanations.ts matches the Product Model
✗ model: limits.maxProjects defaults to 5, but Limits says "Projects" defaults to 3.

1 problem.
```

It exits 1 when anything fails. `--json` writes
`{ config, passed, findings }` instead, for tools and agents.

## env

```bash
npx tunables env
npx tunables env --check
```

Writes `.env.example` from your [deployment values](./deployment-values.md):
each under its section and description, commented out at its default, or left
empty when it must be set. It rewrites the whole file, so a variable you have
not declared is dropped. `--check` only says whether the file is up to date,
and exits 1 when it is not.

## explain

```bash
npx tunables explain
npx tunables explain --check
```

Writes the explanations module from your Product Model, so each field explains
itself in the model's own words. Name where it goes in the config:

```ts [tunables.config.ts]
export default defineConfig({
  groups,
  productModel: 'product-model',
  explanations: 'server/tunables-explanations.ts'
})
```

Then pass it to `createTunables`, and give fields a `fact` instead of `help`:

```ts
import { explanations } from './tunables-explanations'

const limits = defineGroup({
  id: 'limits',
  title: 'Limits',
  entity: 'limits',
  fields: {
    maxProjects: number({ fact: 'Projects', unit: 'count', default: 3 })
  }
})

createTunables({ store, groups: [limits], explanations })
```

`--check` only says whether the module is current. Never edit the module by
hand: change the model, then run `explain` again.

### How the model is read

A [pdd-kit](https://pdd-kit.dev) Product Model keeps each Entity in
`product-model/entities/<id>.md`. A group's `entity` is that id; each line under
the Entity's `## Information kept` is a fact:

```md [product-model/entities/limits.md]
# Limits

## Information kept

- **Projects** — the most projects a workspace may have open at once; defaults to 3
- **Attachment size** — the largest file a task may carry; defaults to 10 megabytes
```

The bold name is the fact a field names. The words after the dash are its
explanation; what follows `defaults to` is the default the model states, and
`check` compares it with the field's own default as it reads, by its numbers:
`10 megabytes` agrees with `10 MB`, and `400 by 225 pixels` with
`400 × 225 pixels`. Without numbers, the words must match, such as
`List`.

## model draft

```bash
npx tunables model draft
npx tunables model draft --out /tmp/settings-facts.md
```

Drafts the facts the Product Model lacks: for each group, preset set and
catalog, one line in the model's own form for every field that names no fact
the model keeps, with its explanation and, for a group, its default. It prints
the draft, or writes it to `--out`.

It never writes the model. A Product Model decides what the product keeps, so
bring the draft to `/pdd-ideate`, which decides each fact with you and writes
it. Then run `tunables explain`.
