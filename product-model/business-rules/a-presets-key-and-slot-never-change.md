---
appliesTo:
  - { type: entity, id: preset, effect: changes, facts: [Key, Slot] }
references:
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesPresetEditor.vue
---

# A preset's key and slot never change

A preset keeps the key and slot it was created with. Its label and values may
change; to fill another slot or take another key, a new preset is created.

## Rationale

What ran under a preset keeps its key, and assignments name it by key and slot,
so a key or slot that moved would silently change what they mean.
