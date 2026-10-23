---
domain: presets-and-catalogs
availability: [{ place: embedded-screens }, { place: http-api }, { place: library }]
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesCatalog.vue
---

# Retire a catalog entry

Stops offering an entry nothing uses: it stays in the catalog, under its id,
but no preset can newly pick it.
