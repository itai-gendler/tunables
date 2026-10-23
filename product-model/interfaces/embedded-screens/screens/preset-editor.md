---
entities:
  - entity: preset
    shows: [Key, Slot, Label, Values]
    collects: [Key, Slot, Label, Values]
  - entity: setting
    shows: [Label, Unit, Allowed values, Default, Explanation, Section, Effects]
  - entity: catalog-entry
    shows: [Id, Values]
references:
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesPresetEditor.vue
---

# Preset editor

One preset being created or edited: its label, its key and slot, which are
chosen once and never change, and its value for each setting of the set, each
with its explanation and default. Problems read beside the setting they are
about, and nothing is saved until the whole preset holds.
