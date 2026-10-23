---
entities:
  - entity: preset
    shows: [Key, Slot, Label, Default, Assigned]
references:
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesPresets.vue
---

# Presets

One preset set, such as Run Configs, slot by slot: each preset with its label,
key, whether it is the slot's default, and how many subjects are assigned it.
From here the Administrator starts a new preset or opens one to edit, makes one
the default, removes one that is not, and opens a preset's history.
