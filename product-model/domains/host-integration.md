---
colorSlot: 4
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
---

# Host integration

What the host app does with its tunables while it runs: reading typed values
where it uses them, and holding the settings while a write of its own depends
on them.

## Boundary

Owns reading values, for the system or as read at a scope, the last good values when the database is away, resolving
which preset a subject runs as, and the hold a host write takes. It does not own
the host app's database, connections or transactions, which stay the host's,
and it changes no value.
