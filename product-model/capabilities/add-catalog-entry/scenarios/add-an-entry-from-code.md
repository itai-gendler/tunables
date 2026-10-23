---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app adds a catalog entry with its id and values
    kind: actor
    actor: host-app
    entities:
      - { entity: catalog-entry, effect: reads, facts: [] }
    contexts:
      code:
        place: library
  - text: The Product checks the id is new and each value against its setting and the catalog's rules
    kind: product
    actor: host-app
    entities:
      - { entity: setting, effect: reads, facts: [Kind, Unit, Allowed values] }
    contexts:
      code:
        place: library
  - text: The Product adds the catalog entry as Available
    kind: product
    actor: host-app
    entities:
      - { entity: catalog-entry, effect: creates, to: Available, facts: [Catalog, Id, Values] }
    contexts:
      code:
        place: library
---

# Add an entry from code

## Trigger

The host app adds catalog entries from its own code, such as when a provider
offers a new model.

## Outcome

The change is checked and recorded exactly as one made through the screens,
under the actor the host app names, or under none when it names nobody.
