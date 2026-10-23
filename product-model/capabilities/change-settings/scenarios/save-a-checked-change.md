---
kind: primary
routes:
  screens: Screens
  api: API
steps:
  - text: The Administrator opens a settings group and reads each setting beside what it affects
    kind: actor
    actor: administrator
    entities:
      - { entity: settings-group, effect: reads, facts: [Title, Description, Values, Changed at, Changed by] }
      - { entity: setting, effect: reads, facts: [Label, Unit, Default, Explanation, Section, Effects, Notes] }
    contexts:
      screens:
        place: embedded-screens::settings-group
      api:
        place: http-api
  - text: The Administrator changes values and saves the group with a reason
    kind: actor
    actor: administrator
    entities: []
    contexts:
      screens:
        place: embedded-screens::settings-group
      api:
        place: http-api
  - text: The Product asks the app's access policy whether this person may change the group
    kind: product
    actor: administrator
    entities:
      - { entity: access-policy, effect: reads, facts: [Signed-in person, May change] }
    contexts:
      screens:
        place: embedded-screens::settings-group
      api:
        place: http-api
  - text: The Product checks the whole settings group, each value against its kind, the rules between its settings, every preset the settings bound, and the app's own checks
    kind: product
    actor: administrator
    entities:
      - { entity: settings-group, effect: reads, facts: [Values, Rules] }
      - { entity: setting, effect: reads, facts: [Kind, Unit, Allowed values] }
      - { entity: preset, effect: reads, facts: [Values] }
    contexts:
      screens:
        place: embedded-screens::settings-group
      api:
        place: http-api
  - text: The Product saves the changed values and shows the settings group with who changed it and when
    kind: product
    actor: administrator
    entities:
      - { entity: settings-group, effect: changes, facts: [Values, Changed at, Changed by] }
    contexts:
      screens:
        place: embedded-screens::settings-group
      api:
        place: http-api
---

# Save a checked change

## Trigger

An Administrator wants the running app to behave differently, such as spending
less on each run.

## Outcome

The group holds the new values, the host app reads them on its next read, and
the history holds one revision with who, when, why and each value before and
after.

## Edge cases

- Saving values that change nothing stores and records nothing.
- Only the values sent change; the rest of the group stays as it is, and the whole group is still checked.
- A value for a setting the group does not declare is refused by name.
- Leaving the screen with unsaved changes asks first.
