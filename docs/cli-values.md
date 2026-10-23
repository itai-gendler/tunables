---
title: Read and change values
description: The commands that read and change stored values, through the same checks and history as the screens.
group: CLI
order: 18
---

# Read and change values: sync, get, set, history, restore

These commands call `connect` in your [`tunables.config.ts`](./cli.md#tunablesconfigts)
and work on your app's own tunables, over its own store. A change from here
goes through exactly the checks a save from a screen does, and is recorded the
same way, with your username and the reason you give.

## sync

```bash
npx tunables sync
```

Brings the stored values in line with the definitions, without changing any
value that is already stored:

- stores each new group at its defaults;
- adds each new field to a stored group at its default;
- adds each new preset field to every stored preset at its default;
- creates a default preset for each slot that has none, from the set's `seed`;
- adds a catalog's `seed` entries when the catalog is empty;
- reports stored fields no definition declares any more. It keeps them; it
  never drops a value silently.

```
✓ seeded run with its defaults
✓ added collection.requestSeconds with its default
✓ created the daily default of run-configs: daily
! collection.queuePollSeconds is stored but no definition declares it; it was kept.
```

Each addition is a revision. Run `sync` in every deploy, after the tables exist
and before the new code serves: a group that was never synced, or a field that
was never added, cannot be read. It is safe to run any number of times.

Changing a definition never changes a stored value. A new default applies to
new environments; an environment that should move to it needs a `set`.

## get

```bash
npx tunables get run
npx tunables get run budgetLimitUsd
npx tunables get run --json
```

Prints a group's stored values as they read, marking each one that differs from
its default:

```
budgetLimitUsd  $40  (default $25)
turnsLimit      400
storyLimit      24
```

With a key, only that value. `--json` prints the raw values.

## set

```bash
npx tunables set run budgetLimitUsd=40 --reason "Launch week"
npx tunables set run storySummaryLength='{"min":60,"max":400}' --reason "Longer summaries"
```

Changes values as `key=value`. A value that parses as JSON is read as JSON,
so numbers, `true`, `false`, and ranges or sizes written as objects work;
anything else is text. Several assignments change the group at once, checked
together.

- `--reason` is required, and kept in the history.
- When the change asks to be [confirmed](./checks-and-guards.md#confirmations-for-costly-changes),
  `set` prints the question and asks at the terminal. `--yes` confirms it from
  a script; without a terminal and without `--yes`, nothing is saved.
- A refused change prints each problem and exits 1.

```
Saved as revision 14.
```

`set` changes groups. Presets and catalog entries change through the screens,
the API, or your code calling `tunables.presets(id)` and `tunables.catalog(id)`.

## history

```bash
npx tunables history run
npx tunables history run --limit 5 --json
```

Shows a group's revisions, newest first, 20 unless `--limit` says otherwise:
who, when, why, and each value before and after.

```
#14  2026-10-23T09:12:44.021Z  ada (terminal)  “Launch week”
    budgetLimitUsd: 25 → 40
#9  2026-10-20T16:03:11.700Z  Ada  “Raised for the backfill”
    budgetLimitUsd: 20 → 25
```

## restore

```bash
npx tunables restore 9 --reason "The launch traffic is over."
```

Puts a group back as it was after revision 9, through the same checks as any
save. If the old values would break something now, the restore is refused and
says why. `--reason` is required; `--yes` confirms a restore that asks to be
confirmed. The new revision's reason reads *"Restored revision 9. The launch
traffic is over."*
