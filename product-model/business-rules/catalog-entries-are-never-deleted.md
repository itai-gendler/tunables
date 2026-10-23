---
appliesTo:
  - { type: entity, id: catalog-entry, effect: removes }
permits: []
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
---

# Catalog entries are never deleted

No one removes a catalog entry. An entry that should no longer be offered is
retired, and stays in its catalog under its id.

## Rationale

Presets, revisions and whatever ran under a preset name entries by id; an entry
that disappeared would leave them naming nothing.
