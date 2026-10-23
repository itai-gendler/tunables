---
kind: validation
routes:
  screens: Screens
steps:
  - text: The catalog already holds a catalog entry with that id, Available or Retired
    kind: condition
    actor: administrator
    entities:
      - { entity: catalog-entry, effect: reads, facts: [Id] }
    contexts:
      screens:
        place: embedded-screens::catalog
  - text: The Administrator adds an entry with that id
    kind: actor
    actor: administrator
    entities: []
    contexts:
      screens:
        place: embedded-screens::catalog
  - text: The Product adds nothing and says the catalog already holds it
    kind: product
    actor: administrator
    entities: []
    contexts:
      screens:
        place: embedded-screens::catalog
---

# Refuse an id already held

## Trigger

An entry is added under an id the catalog already uses, perhaps by a retired
entry.

## Outcome

Nothing is added; a retired entry with that id can be reinstated instead.
