---
kind: primary
routes:
  screens: Screens
  api: API
steps:
  - text: The Administrator changes a catalog entry's values
    kind: actor
    actor: administrator
    entities:
      - { entity: catalog-entry, effect: reads, facts: [Id, Values] }
    contexts:
      screens:
        place: embedded-screens::catalog
      api:
        place: http-api
  - text: The Product checks the values and the catalog's rules, and every preset's own rules against the edited catalog entry
    kind: product
    actor: administrator
    entities:
      - { entity: catalog-entry, effect: reads, facts: [Values] }
      - { entity: preset, effect: reads, facts: [Values] }
    contexts:
      screens:
        place: embedded-screens::catalog
      api:
        place: http-api
  - text: The Product saves the catalog entry's values
    kind: product
    actor: administrator
    entities:
      - { entity: catalog-entry, effect: changes, facts: [Values] }
    contexts:
      screens:
        place: embedded-screens::catalog
      api:
        place: http-api
---

# Edit an entry

## Trigger

What an entry offers has changed, such as a model's rates.

## Outcome

The entry holds its new values, and every preset that picks it still holds.

## Edge cases

- An edit that changes nothing records nothing.
