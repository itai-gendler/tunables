---
kind: primary
routes:
  screens: Screens
  api: API
steps:
  - text: The Administrator reinstates a retired catalog entry
    kind: actor
    actor: administrator
    entities:
      - { entity: catalog-entry, effect: reads, facts: [Id] }
    contexts:
      screens:
        place: embedded-screens::catalog
      api:
        place: http-api
  - text: The Product makes the catalog entry Available again
    kind: product
    actor: administrator
    entities:
      - { entity: catalog-entry, effect: changes, from: Retired, to: Available, facts: [] }
    contexts:
      screens:
        place: embedded-screens::catalog
      api:
        place: http-api
---

# Reinstate a retired entry

## Trigger

Something withdrawn should be offered again.

## Outcome

The entry is Available, and presets may pick it again.

## Edge cases

- Reinstating an entry already Available changes and records nothing.
