---
colorSlot: 2
references:
  - kind: code
    role: implementation
    target: src/server/service.ts
---

# Administration

Changing the stored values of settings groups while the app runs, and reading
back what changed: saving a checked change, resetting to defaults, the history
of revisions, restoring an earlier one, and All settings across every group.

## Boundary

Owns checked changes to groups, their confirmation, their revisions and
restoring them. It does not own who may act, which the host app's access policy
decides, nor presets and catalogs, which have their own screens, and it never
changes a definition or a default.
