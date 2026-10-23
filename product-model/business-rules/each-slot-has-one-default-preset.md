---
appliesTo:
  - { type: entity, id: preset, facts: [Default] }
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
---

# Each slot has one default preset

Every slot of a preset set has exactly one default once synced: the first
preset created in a slot becomes its default, making another the default makes
the former one ordinary, and every subject without an assignment for the slot
resolves to it.
