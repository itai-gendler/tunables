---
title: tunables-define
description: Add, change, rename or remove one value in an app that uses tunables, with its home, its checks, its reads and what happens to stored values.
group: Skills
order: 22
---

# tunables-define

`tunables-define` makes one change to an app's tunables: a setting, a group, a
preset set, a catalog or a deployment value. It decides where the value
belongs, declares it with everything it needs, and says exactly what happens to
the values already stored in each environment.

## What it does

1. **Starts from the current state.** It finds `tunables.config.ts` and the
   definitions, runs `tunables check`, and reports findings that were there
   before it started rather than fixing them unasked.
2. **Classifies the request**: add, change (default, bounds, options, kind,
   unit, section, effects, fact), rename, move between groups or between the
   environment and a setting, or remove. For a new value, it decides its home;
   if the value is code or user data, it says so and stops.
3. **Finds every read and every dependent**: other settings, presets, rows your
   app keeps, and work a change sets off.
4. **Settles the meaning.** With a pdd-kit Product Model, a new setting or a
   change in what one means is a product change: it drafts the fact with
   `tunables model draft` and brings it to `/pdd-ideate`. Without one, it
   writes the field's `help` in the product's words.
5. **Designs the field and its checks**: key, kind, unit, default, bounds,
   section, effects and fact or label; the `rules` it joins, the guard for app
   data that depends on it and the `hold` on the write that saves such data,
   the `within` for presets it bounds, and the `confirm` for a costly change.
   Whatever you did not state, it presents for approval first.
6. **Writes the change**: the definition, new effects or units, each read
   replaced and the old constant, fallback or environment read deleted, and
   `tunables explain` or `tunables env` when they apply.
7. **Plans stored values.** A changed definition never changes a stored value,
   so for each environment it says what `sync` will do and runs or hands you
   each `tunables set` the change needs.
8. **Tests and checks**: each new rule, guard and confirmation through `save`
   with [`tunables/testing`](./testing.md), then `tunables check`, your
   typecheck, lint and tests.

## Stored values, by kind of change

| Change | What happens to stored values |
| --- | --- |
| Add a field or group | `sync` stores it at its default. It must run before the new code reads it. |
| Change a default | Existing environments keep their value; `set` moves one that should change. |
| Tighten bounds, options or kind | A stored value outside them makes `get` throw. Move it inside with `set` before the code ships. |
| Rename or move a key | `sync` adds the new key at its default and keeps the old one. `set` the new key to the old value in each environment. |
| Remove a field or group | `sync` reports the stored key as undeclared and keeps it. |
| Environment to setting | Add the field; after `sync`, `set` the value each environment ran with; remove the variable. |
| Setting to environment | Read each environment's value first, add the deployment value, remove the field, set the variable where it differed. |

## Ask for it

> Make the export batch size tunable, between 100 and 5000.

> Lower the default Story limit to 18, and tell me what happens in production.

> Move `LOG_LEVEL` into a deployment value with a default.
