---
kind: primary
routes:
  screens: Screens
  api: API
steps:
  - text: The Administrator opens All settings
    kind: actor
    actor: administrator
    entities:
      - { entity: settings-group, effect: reads, facts: [Title, Place, Values] }
      - { entity: setting, effect: reads, facts: [Label, Section, Explanation, Effects, Default] }
    contexts:
      screens:
        place: embedded-screens::all-settings
      api:
        place: http-api
  - text: The Administrator finds settings by name, by what they affect, or among those changed from their default
    kind: actor
    actor: administrator
    entities:
      - { entity: setting, effect: reads, facts: [Label, Effects, Default] }
    contexts:
      screens:
        place: embedded-screens::all-settings
      api:
        place: http-api
  - text: Each setting reads with its settings group and section, its current value, its default when it differs, and a link to where its group is edited
    kind: product
    actor: administrator
    entities:
      - { entity: settings-group, effect: reads, facts: [Title, Place, Values] }
      - { entity: setting, effect: reads, facts: [Label, Section, Default] }
    contexts:
      screens:
        place: embedded-screens::all-settings
      api:
        place: http-api
---

# Find a setting across groups

## Trigger

An Administrator knows what they want to change but not which group holds it,
or wants to see everything changed from its defaults.

## Outcome

The Administrator finds the setting and reaches the place where its group is
edited.

## Edge cases

- With only changed settings shown and none changed, the list says every setting is at its default.
- A group with no place of its own names its group instead of a link.
