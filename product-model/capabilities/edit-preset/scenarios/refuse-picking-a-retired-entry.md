---
kind: validation
routes:
  screens: Screens
steps:
  - text: A catalog entry has been retired
    kind: condition
    actor: administrator
    entities:
      - { entity: catalog-entry, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::preset-editor
  - text: The Administrator changes a preset to pick that catalog entry
    kind: actor
    actor: administrator
    entities:
      - { entity: preset, effect: reads, facts: [Label, Values] }
      - { entity: catalog-entry, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::preset-editor
  - text: The Product saves nothing and asks for an Available catalog entry instead
    kind: product
    actor: administrator
    entities:
      - { entity: catalog-entry, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::preset-editor
---

# Refuse picking a retired entry

## Trigger

A preset is pointed at an entry that is no longer offered, such as a retired
model.

## Outcome

The preset stays as it was until an Available entry is picked.
