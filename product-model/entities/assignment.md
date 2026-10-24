---
domain: presets-and-catalogs
references:
  - kind: code
    role: implementation
    target: src/engine/store.ts#Assignment
---

# Assignment

Which preset one subject of the host app runs as for one slot, in place of the
slot's default. A subject with no assignment for a slot follows whichever
preset is the slot's default at the time.

## Information kept

- **Subject** — what runs as the preset, such as one reader, named by the host app; for a preset set that is a layer of a settings group, a scope such as one workspace, which then reads that preset's values as its plan
- **Slot** — the slot it is for
- **Preset** — the preset the subject runs as
