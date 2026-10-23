---
domain: presets-and-catalogs
availability: [{ place: embedded-screens }, { place: http-api }]
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesPresetEditor.vue
---

# Create a preset

Adds a preset to a preset set with its key, slot, label and values, checked
whole: each value against its kind, each catalog entry it picks is Available,
the set's own rules, and that it stays within what the settings groups allow.
The first preset of a slot becomes its default.
