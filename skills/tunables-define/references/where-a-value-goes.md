# Where a value goes

Every value has exactly one home. Putting a value in the wrong place, or in two,
is the mistake tunables exists to prevent. Ask in this order; the first yes
decides.

```text
Is it a value at all, or does it define what the code means?
  layout geometry, file or wire formats, protocol constants, state lists,
  regular expressions, unit conversions                     → code
Does an end user own it?
  a person's preference, their saved filter, rows per page  → the app's user data
Is it a secret, a connection or infrastructure?
  database URL, API key, OAuth client, host, port           → deployment value, required
Would anyone change it while the app runs, without a release?
  no: lock ids, statement batch sizes, how much text is
  kept, log level, queue housekeeping, file bounds          → deployment value, with a default
  yes, and it is several values under a name that a
  subject follows or is assigned (plan, tier, profile)      → a preset set
  yes, and it is a list someone adds to and retires from,
  each entry with attributes that others choose            → a catalog
  yes, otherwise                                            → a setting in a group
```

If an administrator might ever tune a "mechanic", it is a setting. If you
cannot tell whether anyone would tune it while the app runs, ask the user.

## The homes

**Setting** — a field in a `defineGroup`. Stored in the app's database, edited
by an administrator on the screen beside what it affects, checked on every
save, every change a revision. Its default lives only in the definition.
Read with `tunables.get(group)`.

**Preset set** — `definePresets`: named, reusable configurations of the same
fields, each filling one `slot` (such as `daily` and `weekly`), with exactly one
default per slot. A subject follows the slot's default or is assigned another
(`assign`, `TunablesAssign`); code reads it with
`tunables.presets(id).resolve(subject, slot)`. Never embed a copy of a preset
in what uses it: keep its `key`. An "experiment" override is a preset, not an
environment variable.

**Catalog** — `defineCatalog`: entries an administrator adds, edits, retires
and reinstates, each with its own fields, chosen by `pick` fields in presets.
An entry in use cannot be retired. Read with `tunables.catalog(id).available()`
or `.get(entryId)`.

**Deployment value** — a `defineEnvironment` entry: set per deployment, never
tuned while the app runs. Each has a description and, unless it must be set, a
default; `tunables env` lists them all in `.env.example`. Read with
`environment.get(name)` or `environment.read()`.

**User data** — the app's own columns or the browser's storage. Not tunables.

**Code** — what is not a value. A constant here is fine when changing it would
change what the code means rather than how it behaves.

## Which group

- A group is one place an administrator edits, beside what it affects; give it
  a `place` (`{ label, href }`) naming that screen.
- Settings that bound one another belong in one group: a group's `rules` see
  only its own values. A preset set reads any group through `within`.
- A field joins an existing group when the same person tunes it on the same
  screen for the same reason. Otherwise it starts a group.
- Within a group, `section` puts it under the sub-heading of what it governs.

## Signs a value is in the wrong place

- An environment variable that overrides a setting, or a setting read with an
  environment fallback: two homes.
- A literal beside the read (`settings.limit ?? 100`): a second default.
- A per-user value in a group: user data.
- A batch size or lock id on an administrator's screen: a mechanic.
- A value someone keeps asking to change by release: a setting kept in code.
- Several environment variables that always change together for an
  experiment: a preset set.
