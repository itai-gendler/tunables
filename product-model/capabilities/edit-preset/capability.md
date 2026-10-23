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

# Edit a preset

Changes a preset's label and values, checked whole like a new one. Its key and
slot stay as they were created. Every subject assigned it, and every subject
following it as the default, runs as the new values from its next resolve.
