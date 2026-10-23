---
domain: presets-and-catalogs
availability: [{ place: embedded-screens }, { place: http-api }, { place: library }]
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesPresets.vue
---

# Remove a preset

Removes a preset that is not its slot's default. Every subject assigned it
returns to following the slot's default. The preset gets a revision, and so do
the assignments of each subject it returned to the default.
