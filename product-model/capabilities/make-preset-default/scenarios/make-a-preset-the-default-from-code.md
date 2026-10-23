---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app makes a preset its slot's default
    kind: actor
    actor: host-app
    entities:
      - { entity: preset, as: chosen, effect: reads, facts: [Slot, Default] }
    contexts:
      code:
        place: library
  - text: The Product makes it the default and the former default an ordinary preset, the change kept in the history of each
    kind: product
    actor: host-app
    entities:
      - { entity: preset, as: chosen, effect: changes, facts: [Default] }
      - { entity: preset, as: former, effect: changes, facts: [Default] }
    contexts:
      code:
        place: library
---

# Make a preset the default from code

## Trigger

The host app moves a slot to a new default from its own code.

## Outcome

The change is checked and recorded exactly as one made through the screens,
under the actor the host app names, or under none when it names nobody.
