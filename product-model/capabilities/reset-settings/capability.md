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

Puts settings back to the defaults their definitions declare, through the same
checks as any change. On the screens each setting is reset on its own in the
group's form, as Reset to its default or as Clear where its default is empty,
and saved like any change with the reason the person types. Through the HTTP
API and the library a whole group, or the settings named, are reset at once and
recorded with a reason that names what was reset.
