---
kind: validation
routes:
  screens: Screens
steps:
  - text: A preset picks the catalog entry, or the app names something that uses it
    kind: condition
    actor: administrator
    entities:
      - { entity: catalog-entry, effect: reads, facts: [In use by] }
      - { entity: preset, effect: reads, facts: [Label] }
    contexts:
      screens:
        place: embedded-screens::catalog
  - text: The Administrator asks to retire the catalog entry
    kind: actor
    actor: administrator
    entities:
      - { entity: catalog-entry, effect: reads, facts: [Id, In use by] }
    contexts:
      screens:
        place: embedded-screens::catalog
  - text: The Product keeps it Available and names everything that uses it, to be moved first
    kind: product
    actor: administrator
    entities: []
    contexts:
      screens:
        place: embedded-screens::catalog
---

# Refuse to retire an entry in use

## Trigger

An entry something still relies on is about to be withdrawn.

## Outcome

The entry stays Available, and the Administrator knows what to move to another
entry first.
