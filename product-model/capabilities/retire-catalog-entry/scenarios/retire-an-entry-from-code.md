---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app retires a catalog entry
    kind: actor
    actor: host-app
    entities:
      - { entity: catalog-entry, effect: reads, facts: [Id] }
    contexts:
      code:
        place: library
  - text: The Product checks nothing uses the catalog entry, and retires it
    kind: product
    actor: host-app
    entities:
      - { entity: catalog-entry, effect: changes, from: Available, to: Retired, facts: [] }
    contexts:
      code:
        place: library
---

# Retire an entry from code

## Trigger

The host app withdraws an entry from its own code, such as when a provider
retires a model.

## Outcome

The change is checked and recorded exactly as one made through the screens,
under the actor the host app names, or under none when it names nobody.

## Edge cases

- An entry in use is refused, naming everything that uses it, as on the screens.
