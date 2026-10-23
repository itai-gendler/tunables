---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app assigns a subject a preset for a slot
    kind: actor
    actor: host-app
    entities:
      - { entity: preset, effect: reads, facts: [Slot] }
    contexts:
      code:
        place: library
  - text: The Product checks the preset fills that slot, and records the subject's assignment
    kind: product
    actor: host-app
    entities:
      - { entity: preset, effect: reads, facts: [Slot] }
      - { entity: assignment, effect: creates, facts: [Subject, Slot, Preset] }
    contexts:
      code:
        place: library
---

# Assign a preset from code

## Trigger

The host app chooses a subject's preset where it manages that subject, such as
when a reader changes plan.

## Outcome

The change is checked and recorded exactly as one made through the screens,
under the actor the host app names, or under none when it names nobody.

## Edge cases

- Assigning no preset removes the subject's assignment, so it follows the slot's default again.
