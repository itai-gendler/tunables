---
entities:
  - entity: assignment
    shows: [Subject, Slot, Preset]
    collects: [Preset]
  - entity: preset
    shows: [Label, Default]
references:
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesAssign.vue
---

# Assignment

Which preset one subject runs as for one slot, placed wherever the host app
shows that subject. It offers following the slot's default, which names the
current default, or any preset of that slot, the default itself included as a
pinned choice.
