---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app changes a preset's label or values
    kind: actor
    actor: host-app
    entities:
      - { entity: preset, effect: reads, facts: [Key, Slot] }
    contexts:
      code:
        place: library
  - text: The Product checks the preset whole, its key and slot as they were
    kind: product
    actor: host-app
    entities:
      - { entity: preset, effect: reads, facts: [] }
      - { entity: setting, effect: reads, facts: [Kind, Unit, Allowed values] }
      - { entity: settings-group, effect: reads, facts: [Values] }
    contexts:
      code:
        place: library
  - text: The Product saves the preset's label and values
    kind: product
    actor: host-app
    entities:
      - { entity: preset, effect: changes, facts: [Label, Values] }
    contexts:
      code:
        place: library
---

# Edit a preset from code

## Trigger

The host app changes a preset from its own code.

## Outcome

The change is checked and recorded exactly as one made through the screens,
under the actor the host app names, or under none when it names nobody.

## Edge cases

- The edit takes only a label and values; the preset keeps the key and slot it was created with.
