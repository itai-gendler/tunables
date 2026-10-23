---
appliesTo:
  - { type: capability, id: declare-settings }
  - { type: capability, id: check-definitions }
  - { type: capability, id: write-env-example }
  - { type: capability, id: explain-settings }
  - { type: capability, id: draft-missing-facts }
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
  - kind: code
    role: implementation
    target: src/commands/shared.ts#offline
---

# Starting the app never needs the database

Creating the host app's tunables checks the definitions and connects nothing;
the database is reached only when a value is read or changed, or when the
host app's deploy or migrate step syncs, never as the app starts. The definition
checks, `.env.example`, the explanations and the drafted facts all work with no
database at all.
