---
kind: primary
routes:
  screens: Screens
  api: API
steps:
  - text: The Administrator adds a catalog entry with its id and values
    kind: actor
    actor: administrator
    entities:
      - { entity: catalog-entry, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::catalog
      api:
        place: http-api
  - text: The Product checks the id is new and has no spaces, each value against its setting's kind, and the catalog's rules
    kind: product
    actor: administrator
    entities:
      - { entity: setting, effect: reads, facts: [Kind, Unit, Allowed values] }
    contexts:
      screens:
        place: embedded-screens::catalog
      api:
        place: http-api
  - text: The Product adds the catalog entry as Available
    kind: product
    actor: administrator
    entities:
      - { entity: catalog-entry, effect: creates, to: Available, facts: [Catalog, Id, Values] }
    contexts:
      screens:
        place: embedded-screens::catalog
      api:
        place: http-api
---

# Add an entry

## Trigger

Something new should be offered for presets to pick, such as a newly permitted
model.

## Outcome

The entry is Available in the catalog, and any preset may pick it.

## Edge cases

- A value that breaks a setting's kind or the catalog's rules is refused by name, and nothing is added.
