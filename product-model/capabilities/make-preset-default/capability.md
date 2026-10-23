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

# Make a preset the default

Makes a preset its slot's default, and the slot's former default an ordinary
preset, so every subject without an assignment for the slot runs as the new
one. Each of the two presets gets a revision of its own.
