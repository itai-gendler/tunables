---
name: tunables-define
description: Add, change, rename or remove one setting, settings group, preset set, catalog or deployment value in an app that already uses tunables — deciding where the value belongs, its kind, unit, default, bounds, section, effects and Product Model fact, the rules, guards, within checks and confirmations that keep it safe, and the reads, stored values, tests and checks that follow. Use when the user asks to add a setting, make a value tunable, change a default or a bound, let a workspace or user set their own value, add a preset field or catalog field, add an environment variable, or rename or remove any of these; do not use to bring tunables into an app that has none (use tunables-adopt) or to audit the whole app (use tunables-verify).
---

# Define one value

Make one change to an app's tunables — a setting, a group, a preset set, a
catalog or a deployment value — so that the value has exactly one home, one
default, the checks that keep lowering it from breaking anything, an
explanation in the product's words, and stored values that still pass.

The principles this skill holds:

- **One home per value**: a setting in the database, edited by an
  administrator, or a deployment value in the environment, never both.
- **The definition is the one home of its default.** No fallback at a read.
- **Every change is one revision.** Stored values change through `save` or
  `tunables set`, never through SQL.
- **Lowering a limit never breaks what uses it.** Whatever depends on the value
  is named by `rules`, a guard or `within`.
- **Boot never needs the database.**
- **Product meaning is never decided in code.** When the repository uses
  pdd-kit, a setting's meaning and default are decided through `/pdd-ideate`
  first, and the field names that fact.

Read before work:

- [references/where-a-value-goes.md](references/where-a-value-goes.md) — the
  decision for a value's home.
- [references/kinds-and-units.md](references/kinds-and-units.md) — each kind,
  each built-in unit, bounds and field information.
- [references/guards-and-confirmations.md](references/guards-and-confirmations.md)
  — `rules`, guards, `within`, `hold`, `confirm`, `notes` and `uses`.

## Running the CLI

```bash
node <tunables-define-skill-dir>/scripts/run-tunables.mjs --root <dir with tunables.config.ts> <command> [options]
```

The runner uses the CLI version this skill was installed with. `check`, `env`,
`explain` and `model draft` need no database; `sync`, `get`, `set`, `history`
and `restore` call the config's `connect`.

## 1. Establish the situation

1. Find `tunables.config.ts` and the definitions module it imports (search for
   `defineGroup`, `definePresets`, `defineCatalog`, `defineEnvironment`). If
   there is none, stop and use `tunables-adopt`.
2. Read the repository's agent instructions for how to build, test, migrate,
   take screenshots and commit.
3. Run `tunables check` to know the starting state. Pre-existing findings are
   not yours to fix unless the user asks; report them.
4. Note whether the config names a `productModel` (or `product-model/` exists).

## 2. Decide what changes

5. Classify the request: **add**, **change** (default, bounds, options, kind,
   unit, section, effects, fact, where it may be overridden), **rename**, **move** (between groups, or
   between the environment and a setting), or **remove**; and what it is:
   a group field, a whole group, a preset set or its field, a catalog or its
   field, or a deployment value.
6. For a new value, decide its home with
   [where-a-value-goes.md](references/where-a-value-goes.md). If it is code or
   the app's user data, say so, explain why, and stop unless the user disagrees.
7. Find every place the value is read and everything that depends on it
   (other settings, presets, rows the app keeps, work a change sets off).

## 3. Settle the meaning

8. With a Product Model, a new setting, or a change to what one means or
   starts at, is a product change. Draft it: write the field with its `fact`,
   then `tunables model draft --out <file outside the repository>` prints the
   `## Information kept` line the model lacks. Bring that line to the
   `pdd-ideate` skill — invoke it when your harness can, otherwise hand it to
   the user for `/pdd-ideate` — and wait for its approval. Do not write
   `product-model/` from this skill. A pure rename of a key with the same
   meaning needs no model change.
9. Without a Product Model, write the field's `help` in the product's words.

## 4. Design and get approval

10. Choose with [kinds-and-units.md](references/kinds-and-units.md): key, kind,
    unit, default, bounds, `section`, `affects`, and `fact` or `label`/`help`.
    When the app declares `scopes`, decide with
    [where-a-value-goes.md](references/where-a-value-goes.md#per-workspace-and-per-person-scopes)
    whether a workspace or a person may set their own (`override`, freely or
    `at-most`/`at-least` what it inherits), and whether a plan set that is a
    `layer` of the group should carry it too.
11. Choose with
    [guards-and-confirmations.md](references/guards-and-confirmations.md): the
    `rules` it joins, the guard for app data that depends on it (and the
    `hold` on the write that saves such data), the `within` for presets it
    bounds, the `confirm` for a change with costly consequences, and any
    `notes` or `uses`.
12. When you chose anything the user did not state — the home, the default,
    the bounds, a rule — present the change in a few lines (the field as it
    will be declared, its checks, the reads that change, what happens to
    stored values) and wait for approval. Write nothing before it.

## 5. Write

13. Edit the definitions module. Add any new effect id to `effects` and any new
    unit to `units`; `createTunables` refuses an unknown one.
14. Replace each read with `tunables.get(group)` at the point of use, and delete
    the old constant, fallback or environment read. A field with `override`
    is read at the path it applies to:
    `tunables.get(group, { scope: { workspace, user } })`. For a deployment
    value, read it through the environment definitions.
15. Wire the guard, `hold`, `notes` or `uses` in the app's tunables instance
    and on the write paths that need them.
16. Apply the recipe below for what happens to stored values.
17. With a Product Model, once `/pdd-ideate` has written the fact, run
    `tunables explain`. For a deployment value, run `tunables env`.

## 6. Stored values: recipes

Changing a definition never changes a stored value. `tunables sync` only adds
what is missing. Plan each environment explicitly.

- **Add a field or group.** `tunables sync` stores it at its default, as a
  revision. It must run in the deploy step before the new code reads it, or
  `get` throws `TunablesMissing`. Run it in development now.
- **Change a default.** Existing environments keep their stored value. If one
  should move to the new default, `tunables set <group> key=value --reason …`
  there (or reset it from the screen).
- **Tighten bounds, options or kind.** A stored value that no longer passes
  makes `get` throw `TunablesInvalid`. In each environment you can reach, read
  it first (`tunables get <group> <key>`); move it inside the new bounds with
  `tunables set` before the new code ships. Changing a kind (number to range)
  is a rename: a new key, moved across.
- **Rename a key, or move it to another group.** `sync` adds the new key at
  its default and reports the old one as stored but undeclared; it keeps the
  old one. Read the old value (`tunables get`), then
  `tunables set <group> newKey=<value> --reason "Renamed oldKey to newKey"` in
  each environment. The old key stays in the stored row; renaming without
  losing values is a future feature of tunables, so say so in the report.
- **Remove a field or group.** Delete the definition and every read. `sync`
  reports the stored key as undeclared and keeps it. With a Product Model,
  remove the fact through `/pdd-ideate`.
- **Environment to setting.** Add the field with the environment's default;
  after `sync`, `tunables set` the value each environment ran with when it
  differs; delete the environment definition and every read; `tunables env`;
  remove the variable from deployment manifests.
- **Setting to environment.** Read each environment's stored value first; add
  the deployment value; remove the field; `tunables env`; set the variable in
  each deployment that differed.
- **Preset field.** `sync` adds it to every stored preset at its default, one
  revision per preset. A new
  `within` or `rules` check applies to the next save of each preset, and a
  group save is refused while any preset falls outside `within`; check the
  stored presets with the screens or the API before tightening.
- **Catalog field.** Entries are validated on their next edit; `seed` runs only
  when the catalog is empty.
- **Allow an override, or loosen its bound.** Nothing stored changes; each
  scope inherits until someone sets its own.
- **Stop allowing an override at a scope.** Overrides already stored there
  are kept and still read, and can no longer be cleared from that scope. First
  list them (`tunables get <group> --scope workspace=<id>` per scope, or the
  scoped screen), clear each with
  `tunables set <group> --scope workspace=<id> --inherit <key> --reason …`,
  then ship the narrowed `override`.
- **Bound an override that was free.** A stored override outside the new bound
  stays until the next save at that scope or above it, which is then refused
  naming it. Move each inside with `tunables set <group> --scope … key=value`
  before shipping.

Use `tunables set` for groups, with `--scope workspace=acme,user=dana` for a
scope's own values and `--inherit key1,key2` to use the inherited values there
again; presets and catalog entries change through the
screens, the API or the app's own code calling `tunables.presets(id)` and
`tunables.catalog(id)`. Hand the user the exact commands for environments you
cannot reach.

## 7. Tests and screens

18. Test with `tunables/testing`: `testTunables({ groups, presets, catalogs,
    units, effects, guards })` gives synced in-memory tunables;
    `setForTest(tunables, { group: { key: value } })` starts a test past rules
    and guards. Cover each new rule, guard and confirmation through `save`:
    refused with its problem, confirmation asked, then saved with
    `{ confirmed: true }`. For a field with `override`, pass the app's `scopes`
    and `scopeLabel` and test a scoped save: refused outside its bound, and a
    broader change refused while a narrower override would fall outside it.
19. A field added to a group already shown by `TunablesGroupForm` appears by
    itself; a new group or preset set needs its page at its `place`, and an
    entry in navigation. A newly overridable field appears on the scoped forms
    (`<TunablesGroupForm group="…" :scope="{ workspace }" />`) by itself; a
    group with its first `override` needs those pages, and an `authorize` that
    lets owners and members change only their own `target.scope`. When the
    app keeps screenshot baselines, update them the way its instructions say.

## 8. Finish

20. Run `tunables check`, then the app's typecheck, lint and tests.
21. Report:
    - what changed in the definitions, with the field as declared, including
      where it may be overridden;
    - its home and why;
    - reads replaced and old homes removed;
    - checks added: rules, guards and holds, within, confirm;
    - Product Model facts decided through `/pdd-ideate` and explanations
      regenerated, or still pending;
    - stored values: what `sync` will do, and each `tunables set` run or
      handed to the user, per environment;
    - for a rename or removal, the old key left stored;
    - `tunables check` and test results.

## Guardrails

- Never give a value a second home, and never keep a fallback default at a
  read.
- Never write tunables' tables directly; move values with `tunables set` or
  `save`, with a reason.
- Never decide product meaning in code; with pdd-kit, `/pdd-ideate` decides it
  and this skill never writes `product-model/`.
- Never hand-edit the generated explanations module or `.env.example`; run
  `tunables explain` and `tunables env`.
- Never ship a tightened bound, a removed option or a renamed key without
  saying what happens to each environment's stored value.
- Never stage, commit or deploy unless the repository's instructions or the
  user say to.
