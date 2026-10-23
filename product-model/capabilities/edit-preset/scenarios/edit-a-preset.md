---
kind: primary
routes:
  screens: Screens
  api: API
steps:
  - text: The Administrator opens a preset and changes its label or values
    kind: actor
    actor: administrator
    entities:
      - { entity: preset, effect: reads, facts: [Key, Slot, Label, Values] }
    contexts:
      screens:
        place: embedded-screens::preset-editor
      api:
        place: http-api
  - text: The Product checks each value against its kind, each newly picked catalog entry is Available, the set's rules, and that the settings allow every value
    kind: product
    actor: administrator
    entities:
      - { entity: setting, effect: reads, facts: [Kind, Unit, Allowed values] }
      - { entity: catalog-entry, effect: reads, facts: [] }
      - { entity: settings-group, effect: reads, facts: [Values] }
    contexts:
      screens:
        place: embedded-screens::preset-editor
      api:
        place: http-api
  - text: The Product saves the preset's label and values, its key and slot as they were
    kind: product
    actor: administrator
    entities:
      - { entity: preset, effect: changes, facts: [Label, Values] }
    contexts:
      screens:
        place: embedded-screens::preset-editor
      api:
        place: http-api
---

# Edit a preset

## Trigger

The subjects running as a preset need it to behave differently.

## Outcome

The preset holds its new label and values, and one revision records the
change.

## Edge cases

- An edit that changes nothing records nothing.
- A preset that already picked an entry since retired keeps it while that value is left as it is.
