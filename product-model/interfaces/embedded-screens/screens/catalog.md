---
entities:
  - entity: catalog-entry
    shows: [Catalog, Id, Values, In use by]
    collects: [Id, Values]
  - entity: setting
    shows: [Label, Unit, Allowed values, Default, Explanation]
references:
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesCatalog.vue
---

# Catalog

One catalog's entries, Available and Retired, each with its id and its values.
The Administrator adds an entry, edits one, retires one nothing uses, reinstates
a retired one, reads what uses an entry when it cannot be retired, and opens an
entry's history.
