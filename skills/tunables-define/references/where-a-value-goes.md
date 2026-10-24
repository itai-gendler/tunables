# Where a value goes

Every value has exactly one home. Putting a value in the wrong place, or in two,
is the mistake tunables exists to prevent. Ask in this order; the first yes
decides.

```text
Is it a value at all, or does it define what the code means?
  layout geometry, file or wire formats, protocol constants, state lists,
  regular expressions, unit conversions                     → code
Does an end user own it, with no default anyone tunes for them?
  their saved filter, rows per page, a dismissed hint       → the app's user data
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
    and a workspace or a person may set their own,
    within what it inherits                                 → that setting, with `override`
```

If an administrator might ever tune a "mechanic", it is a setting. If you
cannot tell whether anyone would tune it while the app runs, ask the user.

## The homes

**Setting** — a field in a `defineGroup`. Stored in the app's database, edited
by an administrator on the screen beside what it affects, checked on every
save, every change a revision. Its default lives only in the definition.
Read with `tunables.get(group)`.

**Preset set** — `definePresets`: named, reusable configurations of the same
fields, each filling one `slot` (such as Tasklane's `plan`), with exactly one
default per slot. A subject follows the slot's default or is assigned another
(`assign`, `TunablesAssign`); code reads it with
`tunables.presets(id).resolve(subject, slot)`. Never embed a copy of a preset
in what uses it: keep its `key`. An "experiment" override is a preset, not an
environment variable. A preset set declared as a `layer` of a group is
read through that group instead: `get(group, { scope })` already includes the
subject's preset.

**Catalog** — `defineCatalog`: entries an administrator adds, edits, retires
and reinstates, each with its own fields, chosen by `pick` fields in presets.
An entry in use cannot be retired. Read with `tunables.catalog(id).available()`
or `.get(entryId)`.

**Deployment value** — a `defineEnvironment` entry: set per deployment, never
tuned while the app runs. Each has a description and, unless it must be set, a
default; `tunables env` lists them all in `.env.example`. Read with
`environment.get(name)` or `environment.read()`.

**Override** — not a home of its own: a setting whose field declares
`override` takes a value per scope, stored in the same group (see below).

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

## Per workspace and per person: scopes

An app with tenants declares its chain of scopes once, broadest first:
`createTunables({ scopes: ['workspace', 'user'], scopeLabel })`, where
`scopeLabel(scope, id)` names a scope in refusals and screens ("Acme"). A
value is then read through its layers: the system value, a plan the workspace
is on, the workspace's own, the person's own. The most specific wins.

- A field is set only for the whole system unless it declares `override`.
  Declare it when staff set a value for everyone and a workspace owner or a
  person may set their own: Tasklane's Default view
  (`override: ['workspace', 'user']`), Reminder time (`override: ['user']`).
- A limit a workspace may only lower takes a bound per scope:
  `override: { workspace: 'at-most', user: 'at-most' }` (or `'at-least'`, or
  `'free'`). Bounds are for `number` fields only. Tasklane's AI suggestions a
  day may be lowered for a workspace and again for a person, never raised.
- Plans or tiers that set a group's values for a workspace are a preset set
  with `layer: { group, scope, slot? }`: Tasklane's Plans are a layer of
  Limits at `workspace`, between the system value and the workspace's own.
  The set's fields must be fields of the group, of the same kinds.
- Keep a field system-only when it is a safety rail, a cost staff answer for,
  or a value nobody outside staff should see (Tasklane's Suggestion model).
- Code reads at a path: `tunables.get('limits', { scope: { workspace, user } })`.
  A read without `scope` is the system value, which is wrong wherever a
  workspace's own applies.

## Signs a value is in the wrong place

- An environment variable that overrides a setting, or a setting read with an
  environment fallback: two homes.
- A literal beside the read (`settings.limit ?? 100`): a second default.
- A per-user value in a group with no `override`: user data, or a field
  that should declare `override: ['user']`.
- A per-workspace or per-user column beside a setting, with a hand-written
  `own ?? plan ?? setting` at the read: an override kept outside tunables.
- A batch size or lock id on an administrator's screen: a mechanic.
- A value someone keeps asking to change by release: a setting kept in code.
- Several environment variables that always change together for an
  experiment: a preset set.
