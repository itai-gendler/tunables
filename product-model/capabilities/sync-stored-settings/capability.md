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
---

# Sync stored settings

Brings what is stored in line with what is declared: stores a new group with
every setting at its default, adds a new setting to a stored group at its
default, creates each preset slot's default where the slot has none, and fills
an empty catalog with the entries it starts with. Each is recorded as a
revision. A stored setting no definition declares any more is reported and
kept.

## Intent

Declaring a setting and running sync is all it takes for the setting to exist
everywhere, at the default its declaration states, with nothing hand-written
into the database.
