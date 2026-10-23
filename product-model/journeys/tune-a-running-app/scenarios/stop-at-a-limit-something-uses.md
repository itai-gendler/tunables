---
kind: validation
result: not-achieved
routes:
  screens: Screens
steps:
  - text: The Administrator finds a limit in All settings and follows the link to where its settings group is edited
    kind: actor
    actor: administrator
    capability: view-all-settings
    entities:
      - { entity: setting, effect: reads, facts: [Label, Section] }
      - { entity: settings-group, effect: reads, facts: [Place] }
    contexts:
      screens:
        place: embedded-screens::all-settings
  - text: The Administrator lowers the limit below what something already uses and saves
    kind: actor
    actor: administrator
    capability: change-settings
    entities: []
    contexts:
      screens:
        place: embedded-screens::settings-group
  - text: The Product saves nothing and names the preset that uses more
    kind: product
    actor: administrator
    capability: change-settings
    entities:
      - { entity: preset, effect: reads, facts: [Label] }
    contexts:
      screens:
        place: embedded-screens::settings-group
---

# Stop at a limit something uses

## Trigger

The Administrator wants a lower limit than a preset already uses.

## Outcome

The goal is not achieved yet: the limit is unchanged until the preset is
changed first, and the app never ran with a preset outside its limits.
