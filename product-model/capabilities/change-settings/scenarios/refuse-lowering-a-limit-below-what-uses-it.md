---
kind: validation
routes:
  screens: Screens
steps:
  - text: A preset, or something the app keeps, uses more than a lower limit would allow
    kind: condition
    actor: administrator
    entities:
      - { entity: preset, effect: reads, facts: [Label, Values] }
    contexts:
      screens:
        place: embedded-screens::settings-group
  - text: The Administrator lowers the limit and saves
    kind: actor
    actor: administrator
    entities: []
    contexts:
      screens:
        place: embedded-screens::settings-group
  - text: The Product finds every preset the lower limit would leave outside the settings, and asks the app's own checks about what it keeps
    kind: product
    actor: administrator
    entities:
      - { entity: preset, effect: reads, facts: [Label, Values] }
      - { entity: settings-group, effect: reads, facts: [Values] }
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::settings-group
  - text: The Product saves nothing and names each preset and each thing that uses more
    kind: product
    actor: administrator
    entities:
      - { entity: preset, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::settings-group
---

# Refuse lowering a limit below what uses it

## Trigger

An Administrator lowers a limit that something already uses more of, such as a
budget limit below a preset's budget.

## Outcome

The limit stays as it was. The Administrator knows exactly what to change
first, and once it is, the same change saves.
