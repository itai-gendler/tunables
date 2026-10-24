---
domain: definitions
availability: [{ place: tunables-cli }, { place: library }]
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
  - kind: code
    role: implementation
    target: src/commands/values.ts#runSync
  - kind: code
    role: implementation
    target: src/postgres/index.ts#migrate
    title: Creates tunables' tables before the first sync
  - kind: code
    role: implementation
    target: src/postgres/index.ts#tunablesSql
    title: The same tables as SQL for a hand-written migration
  - kind: code
    role: implementation
    target: src/postgres/drizzle.ts
    title: The same tables as Drizzle schema in the host app's own migrations
---

# Sync stored settings

Brings what is stored in line with what is declared: stores a new group with
every setting at its default, adds a new setting to a stored group at its
default, adds a setting newly declared on a preset set to every stored preset at
its default, creates each preset slot's default where the slot has none, and
fills an empty catalog with the entries it starts with. Each group and each
preset it changes is recorded as a revision of its own. A stored setting no
definition declares any more is reported and kept. Sync touches only the
system's values: a scope's override is never seeded, and exists only once
someone overrides a value there.

Sync runs where the host app sets up its storage: in its deploy or migrate
step, once tunables' tables exist, whether the host app creates them through
tunables, in its own migrations from the SQL tunables gives, or from the Drizzle
tables in its own schema. Starting the app never syncs.

## Intent

Declaring a setting and running sync is all it takes for the setting to exist
everywhere, at the default its declaration states, with nothing hand-written
into the database.
