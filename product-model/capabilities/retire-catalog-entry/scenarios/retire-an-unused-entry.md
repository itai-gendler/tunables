---
kind: primary
routes:
  screens: Screens
  api: API
steps:
  - text: The Administrator retires a catalog entry nothing uses
    kind: actor
    actor: administrator
    entities:
      - { entity: catalog-entry, effect: reads, facts: [Id, In use by] }
    contexts:
      screens:
        place: embedded-screens::catalog
      api:
        place: http-api
  - text: The Product checks what uses the catalog entry, and retires it
    kind: product
    actor: administrator
    entities:
      - { entity: catalog-entry, effect: changes, from: Available, to: Retired, facts: [] }
    contexts:
      screens:
        place: embedded-screens::catalog
      api:
        place: http-api
---

# Retire an unused entry

## Trigger

Something should no longer be offered, such as a model being withdrawn.

## Outcome

The entry is Retired: it is kept, its history is kept, and no preset can newly
pick it.

## Edge cases

- Retiring an entry already Retired changes and records nothing.
