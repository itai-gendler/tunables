---
domain: administration
availability: [{ place: embedded-screens }, { place: http-api }, { place: library }]
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesField.vue
---

# Reset settings

Puts one setting, chosen settings or a whole group back to the defaults their
definitions declare, through the same checks as any change, and records it with
a reason that names what was reset.
