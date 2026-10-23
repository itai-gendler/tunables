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

# Edit a catalog entry

Changes an entry's values, its id as it was, checked against each setting's
kind, the catalog's own rules, and the rules of every preset that would read
the edited entry.
