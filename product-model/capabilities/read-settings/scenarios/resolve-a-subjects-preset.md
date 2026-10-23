---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app asks which preset a subject runs as for a slot
    kind: actor
    actor: host-app
    entities:
      - { entity: preset, effect: reads, facts: [] }
    contexts:
      code:
        place: library
  - text: The Product returns the preset assigned to the subject, or the slot's default when none is, with its key, label and values
    kind: product
    entities:
      - { entity: assignment, effect: reads, facts: [Subject, Slot, Preset] }
      - { entity: preset, effect: reads, facts: [Key, Label, Default, Values] }
    contexts:
      code:
        place: library
---

# Resolve a subject's preset

## Trigger

The host app is about to run something for a subject under a preset, such as
writing a reader's daily edition.

## Outcome

The host app knows which preset applies and its values, and keeps the key and
values with whatever it runs, so a later change to the preset does not rewrite
what already ran.
