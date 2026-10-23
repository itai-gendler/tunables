---
kind: validation
routes:
  screens: Screens
  api: API
steps:
  - text: The Administrator saves a value outside its unit, choices or length, or values that break a rule between the group's settings
    kind: actor
    actor: administrator
    entities:
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::settings-group
      api:
        place: http-api
  - text: The Product checks the whole settings group and finds each value outside its kind and each rule broken
    kind: product
    actor: administrator
    entities:
      - { entity: settings-group, effect: reads, facts: [Values, Rules] }
      - { entity: setting, effect: reads, facts: [Label, Kind, Unit, Allowed values] }
    contexts:
      screens:
        place: embedded-screens::settings-group
      api:
        place: http-api
  - text: The Product saves nothing and answers with each problem in the setting's own words, beside the setting it is about
    kind: product
    actor: administrator
    entities:
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::settings-group
      api:
        place: http-api
---

# Refuse a change that does not hold

## Trigger

A value is mistyped, or two settings that bound one another are changed out of
step, such as a shortest made longer than the longest.

## Outcome

Nothing is stored or recorded. The edited values stay on the screen, each
problem beside its setting, until the Administrator fixes them.
