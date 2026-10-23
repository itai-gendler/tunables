---
kind: primary
routes:
  code: Code
steps:
  - text: The Developer declares a settings group with its title, description, place, rules and confirmation, and each setting with its kind, unit, default, fact, section and effects
    kind: actor
    actor: developer
    entities:
      - { entity: settings-group, effect: creates, facts: [Title, Description, Place, Rules, Confirmation] }
      - { entity: setting, effect: creates, with: settings-group, facts: [Key, Label, Kind, Unit, Allowed values, Default, Fact, Section, Effects] }
    contexts:
      code:
        place: library
  - text: The Host app creates its tunables from the definitions and its own database
    kind: actor
    actor: host-app
    entities: []
    contexts:
      code:
        place: library
  - text: The Product checks every definition without touching the database, that each unit exists, each pick names a catalog, each effect is declared and each default passes its own check
    kind: product
    entities:
      - { entity: setting, effect: reads, facts: [Kind, Unit, Allowed values, Default, Effects] }
    contexts:
      code:
        place: library
  - text: The Host app reads the group's values typed as their kinds declare
    kind: actor
    actor: host-app
    entities: []
    contexts:
      code:
        place: library
---

# Declare a settings group

## Trigger

The Developer wants a value the app uses to be changeable while it runs.

## Outcome

The group and its settings are declared once, the definitions hold, and the
host app reads the group's values typed. Nothing is stored until the group is
synced.

## Edge cases

- A preset set is declared the same way, with its slots, how the settings bound a preset, and the presets a slot starts with.
- A catalog is declared the same way, with what its entries are called and the entries an empty catalog starts with.
- A unit the app needs, such as a currency, is declared beside the built-in ones and bounds every value measured in it.
