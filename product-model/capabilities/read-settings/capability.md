---
domain: host-integration
availability: [{ place: library }, { place: tunables-cli }]
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
  - kind: code
    role: implementation
    target: src/commands/values.ts#runGet
---

# Read settings

The host app reads a group's values where it uses them, typed as their kinds
declare and checked as they are read; reads which preset a subject runs as for
a slot; and hears of each change committed in its own process. A Developer
prints a group's stored values at a terminal. A value that is
not stored, or no longer holds, is never stood in for by a guess.

## Intent

A read is the moment a setting does its job, so it must return exactly what was
saved and checked, or say plainly why it cannot.
