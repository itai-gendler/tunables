---
appliesTo:
  - { type: entity, id: preset, effect: removes }
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
---

# The default preset cannot be removed

A slot's default preset is never removed; another preset is made the default
first. Removing any other preset returns every subject assigned it to the slot's
default.
