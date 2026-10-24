---
domain: presets-and-catalogs
availability: [{ place: embedded-screens }, { place: http-api }, { place: library }]
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesPresetEditor.vue
---

# Edit a preset

Changes a preset's label and values, checked whole like a new one. Its key and
slot stay as they were created. Every subject assigned it, and every subject
following it as the default, runs as the new values from its next resolve.
Where the preset is a plan, a change that would leave a scope's override
outside its bound is refused naming it.
