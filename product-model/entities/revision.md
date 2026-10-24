---
domain: administration
references:
  - kind: code
    role: implementation
    target: src/engine/store.ts#Revision
---

# Revision

One change to a settings group, a scope's override of one, a preset, a catalog
entry or a subject's assignment, as the history shows it: who made it, when, why, and each value
before and after. Revisions are only ever added; a group's revision holds the
whole group as it was after the change, and a scope's revision the whole of
that scope's override, so either can be restored.

## Information kept

- **Target** — what it is about: a settings group for the whole system, a settings group at one scope, a preset, a catalog entry, or a subject's assignments in a preset set
- **Actor** — who made the change, as the host app names them, or the person at a terminal; none when nobody was named
- **Reason** — why, in their words, when one was given; a reset of a whole group or of named settings, through the HTTP API or the library, says what was reset, and a restore names the revision it restored
- **Changes** — each value before and after
- **Snapshot** — the whole of what changed, as it was after the change
- **At** — when it was made; a later revision always comes after an earlier one
