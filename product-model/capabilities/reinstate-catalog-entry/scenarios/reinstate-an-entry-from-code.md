---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app reinstates a retired catalog entry
    kind: actor
    actor: host-app
    entities:
      - { entity: catalog-entry, effect: reads, facts: [Id] }
    contexts:
      code:
        place: library
  - text: The Product makes the catalog entry Available again
    kind: product
    actor: host-app
    entities:
      - { entity: catalog-entry, effect: changes, from: Retired, to: Available, facts: [] }
    contexts:
      code:
        place: library
---

# Reinstate an entry from code

## Trigger

The host app offers a withdrawn entry again from its own code.

## Outcome

The change is checked and recorded exactly as one made through the screens,
under the actor the host app names, or under none when it names nobody.
