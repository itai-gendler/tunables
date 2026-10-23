---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app creates a preset with its key, slot, label and values
    kind: actor
    actor: host-app
    entities:
      - { entity: preset, effect: reads, facts: [] }
    contexts:
      code:
        place: library
  - text: The Product checks it whole, as a preset created on the screens is checked
    kind: product
    actor: host-app
    entities:
      - { entity: preset, effect: reads, facts: [] }
      - { entity: setting, effect: reads, facts: [Kind, Unit, Allowed values] }
      - { entity: settings-group, effect: reads, facts: [Values] }
    contexts:
      code:
        place: library
  - text: The Product creates the preset, as its slot's default when the slot had none
    kind: product
    actor: host-app
    entities:
      - { entity: preset, effect: creates, facts: [Set, Key, Slot, Label, Default, Values] }
    contexts:
      code:
        place: library
---

# Create a preset from code

## Trigger

The host app creates presets from its own code, such as from its own
administration or an import.

## Outcome

The change is checked and recorded exactly as one made through the screens,
under the actor the host app names, or under none when it names nobody.
