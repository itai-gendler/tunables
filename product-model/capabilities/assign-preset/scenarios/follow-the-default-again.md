---
kind: edge
routes:
  screens: Screens
steps:
  - text: The Administrator chooses to follow the slot's default for a subject that has a preset assigned
    kind: actor
    actor: administrator
    entities:
      - { entity: assignment, effect: reads, facts: [Preset] }
      - { entity: preset, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::assignment
  - text: The Product removes the subject's assignment for that slot
    kind: product
    actor: administrator
    entities:
      - { entity: assignment, effect: removes }
    contexts:
      screens:
        place: embedded-screens::assignment
---

# Follow the default again

## Trigger

A subject no longer needs its own preset.

## Outcome

The subject runs as whichever preset is the slot's default, now and after it
changes.
