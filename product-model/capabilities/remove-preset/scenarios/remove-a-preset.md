---
kind: primary
routes:
  screens: Screens
  api: API
steps:
  - text: The Administrator removes a preset that is not its slot's default
    kind: actor
    actor: administrator
    entities:
      - { entity: preset, effect: reads, facts: [Label, Default, Assigned] }
    contexts:
      screens:
        place: embedded-screens::presets
      api:
        place: http-api
  - text: The Product removes the preset, and every assignment of it with it
    kind: product
    actor: administrator
    entities:
      - { entity: preset, effect: removes }
      - { entity: assignment, effect: removes, with: preset }
    contexts:
      screens:
        place: embedded-screens::presets
      api:
        place: http-api
  - text: The Product says how many assigned subjects returned to the slot's default
    kind: product
    actor: administrator
    entities: []
    contexts:
      screens:
        place: embedded-screens::presets
      api:
        place: http-api
---

# Remove a preset

## Trigger

A preset is no longer wanted.

## Outcome

The preset is gone, nobody runs as it, and its history remains.
