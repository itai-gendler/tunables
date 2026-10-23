---
domain: presets-and-catalogs
availability: [{ place: embedded-screens }, { place: http-api }]
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesAssign.vue
---

# Assign a preset

Chooses which preset one subject of the host app runs as for one slot: a
preset of that slot, pinned, or the slot's default, followed wherever it moves.
