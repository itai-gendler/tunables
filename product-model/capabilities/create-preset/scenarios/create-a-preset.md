---
kind: primary
routes:
  screens: Screens
  api: API
steps:
  - text: The Administrator gives a new preset its key, slot, label and values
    kind: actor
    actor: administrator
    entities:
      - { entity: preset, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::preset-editor
      api:
        place: http-api
  - text: The Product checks the key is new and well formed, the slot is one the set fills, each value against its kind, each picked catalog entry is Available, the set's rules, and that the settings allow every value
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
  - text: The Product creates the preset, as its slot's default when the slot had none
    kind: product
    actor: administrator
    entities:
      - { entity: preset, effect: creates, facts: [Set, Key, Slot, Label, Default, Values] }
    contexts:
      screens:
        place: embedded-screens::preset-editor
      api:
        place: http-api
---

# Create a preset

## Trigger

Some subjects need different values than the slot's default gives them, such
as a heavier daily run for a few readers.

## Outcome

The preset exists in its slot and can be assigned, or followed as the default
when it is the slot's first.

## Edge cases

- A value left out starts at the setting's default.
- A key already held, a key that is not lowercase words joined by hyphens, a slot the set does not fill, or an empty label is refused by name.
