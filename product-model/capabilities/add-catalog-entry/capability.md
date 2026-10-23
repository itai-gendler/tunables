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

# Add a catalog entry

Adds an entry to a catalog with its id and values, checked against each
setting's kind and the catalog's own rules, Available to be picked at once.
