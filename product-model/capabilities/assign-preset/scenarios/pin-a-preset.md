---
kind: primary
routes:
  screens: Screens
  api: API
steps:
  - text: The Administrator chooses which preset a subject runs as for a slot
    kind: actor
    actor: administrator
    entities:
      - { entity: assignment, effect: reads, facts: [Subject, Slot, Preset] }
      - { entity: preset, effect: reads, facts: [Label, Default] }
    contexts:
      screens:
        place: embedded-screens::assignment
      api:
        place: http-api
  - text: The Product checks the preset exists and fills that slot, and assigns it to the subject
    kind: product
    actor: administrator
    entities:
      - { entity: assignment, effect: creates, facts: [Subject, Slot, Preset] }
      - { entity: preset, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::assignment
      api:
        place: http-api
---

# Pin a preset

## Trigger

One subject should run differently from the slot's default.

## Outcome

The subject runs as the chosen preset, even after the slot's default changes.

## Edge cases

- Choosing the slot's default itself pins it, so the subject stays on it when another becomes the default.
- Choosing another preset for a subject that has one replaces it; choosing the one it has records nothing.
