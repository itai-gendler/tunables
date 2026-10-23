---
kind: validation
routes:
  api: API
steps:
  - text: The Administrator assigns a subject a preset for a slot that preset does not fill
    kind: actor
    actor: administrator
    entities:
      - { entity: preset, effect: reads, facts: [Slot] }
    contexts:
      api:
        place: http-api
  - text: The Product assigns nothing and names the slot the preset fills
    kind: product
    actor: administrator
    entities:
      - { entity: preset, effect: reads, facts: [] }
    contexts:
      api:
        place: http-api
---

# Refuse a preset of another slot

## Trigger

A weekly preset is offered for a subject's daily slot.

## Outcome

The subject's assignment stays as it was.

## Edge cases

- A preset or a slot that does not exist is refused by name.
