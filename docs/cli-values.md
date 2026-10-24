---
title: Read and change values
description: The commands that read and change stored values, through the same checks and history as the screens.
group: CLI
order: 21
---

# Read and change values: sync, get, set, history, restore

These commands call `connect` in your [`tunables.config.ts`](./cli.md#tunablesconfigts)
and work on your app's own tunables, over its own store. A change from here
goes through exactly the checks a save from a screen does, and is recorded the
same way, with your username and the reason you give.

`get`, `set`, `history` and `restore` can instead go through your app's API;
see [Through your app's API](#through-your-apps-api).

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
✓ seeded workspace with its defaults
✓ added limits.attachmentMb with its default
✓ created free in plans, the plan default
✓ created pro in plans
✓ created team in plans
! limits.maxMembers is stored but no definition declares it; it was kept.
```

`sync` touches only the system values; a scope's own values are never seeded.
Each addition is a revision. Run `sync` in every deploy, after the tables exist
and before the new code serves: a group that was never synced, or a field that
was never added, cannot be read. It is safe to run any number of times.

Changing a definition never changes a stored value. A new default applies to
new environments; an environment that should move to it needs a `set`.

## get

```bash
npx tunables get limits
npx tunables get limits maxProjects
npx tunables get limits --json
npx tunables get limits --scope workspace=acme
```

Prints a group's stored values as they read, marking each one that differs from
its default:

```
maxProjects          5  (default 3)
maxTasksPerProject   200
attachmentMb         10 MB
aiSuggestionsPerDay  20
```

With a key, only that value. `--json` prints the raw values.

`--scope` reads at a [scope](./scopes.md), written as `scope=id` pairs
separated by commas, broadest first: `workspace=acme` or
`workspace=acme,user=dana`. Each field the scope may set says where its value
comes from:

```
maxProjects          20  (set here; inherits 50 from Pro plan)
maxTasksPerProject   5,000  (from Pro plan)
attachmentMb         100 MB  (from Pro plan)
aiSuggestionsPerDay  100  (from Pro plan)
```

## set

```bash
npx tunables set limits maxProjects=5 --reason "More room on the free tier"
npx tunables set limits titleLength='{"min":1,"max":300}' --reason "Longer titles"
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

### At a scope

`--scope` makes the change at a scope, through the same checks, including the
field's [bound](./scopes.md#bounds). `--inherit` takes comma-separated keys
the scope stops overriding, so it uses the inherited value again. One command
may set some fields and inherit others:

```bash
npx tunables set limits maxProjects=20 --scope workspace=acme --reason "Keep Acme small while it trials"
npx tunables set workspace reminderHour=7 --scope workspace=acme,user=dana --reason "Dana starts early"
npx tunables set limits --scope workspace=acme --inherit maxProjects,aiSuggestionsPerDay --reason "Back to the plan"
```

```
✗ Projects may be at most 50 for Acme, the value it inherits.
```

`--inherit` needs `--scope`: only a scope inherits.

`set` changes groups. Presets and catalog entries change through the screens,
the API, or your code calling `tunables.presets(id)` and `tunables.catalog(id)`.

## history

```bash
npx tunables history limits
npx tunables history limits --limit 5 --json
npx tunables history limits --scope workspace=acme
```

Shows a group's revisions, newest first, 20 unless `--limit` says otherwise:
who, when, why, and each value before and after. With `--scope`, that scope's
own revisions; without it, the system values'.

```
#14  2026-10-23T09:12:44.021Z  ada (terminal)  “More room on the free tier”
    maxProjects: 3 → 5
#9  2026-10-20T16:03:11.700Z  Sam  “Launch offer”
    maxProjects: 2 → 3
```

## restore

```bash
npx tunables restore 9 --reason "The offer is over."
```

Puts a group back as it was after revision 9, through the same checks as any
save. A scope's revision names its scope, so restoring it puts that scope's
own values back, with no `--scope`. If the old values would break something
now, the restore is refused and says why. `--reason` is required; `--yes`
confirms a restore that asks to be confirmed. The new revision's reason reads
*"Restored revision 9. The offer is over."*

## Through your app's API

`get`, `set`, `history` and `restore` take `--url`, or read `TUNABLES_URL`:
the address of your app's tunables API, such as
`https://tasklane.example.com/api/tunables`. With it they call that API, as the
screens do, and send `TUNABLES_TOKEN` as `Authorization: Bearer <token>`.

```bash
export TUNABLES_URL=https://tasklane.example.com/api/tunables
export TUNABLES_TOKEN=…
npx tunables get limits --scope workspace=acme
npx tunables set limits maxProjects=20 --scope workspace=acme --reason "Agreed with Acme's owner"
```

- No `tunables.config.ts` and no database credentials are needed.
- Your app's `actor` and `authorize` apply. The revision records the actor
  your app names for the token, not your username.
- A refusal prints what the app answered:
  *"✗ https://tasklane.example.com/api/tunables answered 404: Not found. Check
  the URL, and that TUNABLES_TOKEN is one the app allows this."* An app
  answers 404 to a request it does not allow, so a wrong URL and a refused
  token look the same.

Without `--url`, the commands work on the database through `connect`, and
`authorize` is not asked: whoever has the database credentials already reaches
everything. `sync` always works on the database. See
[Who can do what](./access.md#the-terminal).
