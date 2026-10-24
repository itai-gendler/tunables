---
domain: presets-and-catalogs
availability: [{ place: embedded-screens }, { place: http-api }, { place: library }]
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
Where the preset set is the plan of a settings group, the subject is a scope,
such as a workspace, and the assignment moves it to another plan; a move that
would leave an override inside that scope outside its bound is refused naming
it.
