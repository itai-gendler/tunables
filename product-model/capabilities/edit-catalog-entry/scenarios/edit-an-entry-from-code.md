---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app changes a catalog entry's values
    kind: actor
    actor: host-app
    entities:
      - { entity: catalog-entry, effect: reads, facts: [Id] }
    contexts:
      code:
        place: library
  - text: The Product checks the values, the catalog's rules and every preset's own rules against the edited catalog entry
    kind: product
    actor: host-app
    entities:
      - { entity: catalog-entry, effect: reads, facts: [Values] }
      - { entity: preset, effect: reads, facts: [Values] }
    contexts:
      code:
        place: library
  - text: The Product saves the catalog entry's values
    kind: product
    actor: host-app
    entities:
      - { entity: catalog-entry, effect: changes, facts: [Values] }
    contexts:
      code:
        place: library
---

# Edit an entry from code

## Trigger

The host app keeps a catalog in step with something it learns, such as a model's
new rates.

## Outcome

The change is checked and recorded exactly as one made through the screens,
under the actor the host app names, or under none when it names nobody.
