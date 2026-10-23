---
domain: presets-and-catalogs
relations:
  - entity: assignment
    verb: is assigned through
    cardinality: one-to-many
references:
  - kind: code
    role: implementation
    target: src/model/definitions.ts#definePresets
---

# Preset

A named set of values for the settings a preset set declares, such as a Run
Config, that subjects of the host app run as. A preset fills one slot, such as
Daily or Weekly; each slot has one default, which every subject without an
assignment for that slot follows. Its values stay within what the settings
groups allow.

## Information kept

- **Set** — the preset set it belongs to, such as Run Configs
- **Key** — its stable name, lowercase words joined by hyphens; it never changes
- **Slot** — what it fills; it never changes
- **Label** — what administration calls it
- **Default** — whether every subject without an assignment for its slot runs as it
- **Values** — its value for each setting its set declares
- **Assigned** — how many subjects are assigned it rather than following the default
