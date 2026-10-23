---
kind: edge
routes:
  screens: Screens
steps:
  - text: The Administrator chooses Reset to its default beside a setting, or Clear where its default is empty
    kind: actor
    actor: administrator
    entities:
      - { entity: setting, effect: reads, facts: [Label, Default] }
    contexts:
      screens:
        place: embedded-screens::settings-group
  - text: The Product puts the setting's default in the form, saving nothing yet
    kind: product
    actor: administrator
    entities:
      - { entity: setting, effect: reads, facts: [Default] }
    contexts:
      screens:
        place: embedded-screens::settings-group
  - text: The Administrator saves the settings group with a reason of their own
    kind: actor
    actor: administrator
    entities:
      - { entity: settings-group, effect: reads, facts: [Values] }
    contexts:
      screens:
        place: embedded-screens::settings-group
  - text: The Product checks and saves the settings group like any change, with the reason typed
    kind: product
    actor: administrator
    entities:
      - { entity: settings-group, effect: changes, facts: [Values, Changed at, Changed by] }
    contexts:
      screens:
        place: embedded-screens::settings-group
---

# Reset a setting in the form

## Trigger

One value in a group should go back to its default, among other changes or on
its own.

## Outcome

The setting holds its default, saved with the group as one change and recorded
with the reason the Administrator typed.

## Edge cases

- The screens reset one setting at a time; resetting the whole group or chosen settings at once is offered through the HTTP API and the library.
- Leaving before saving keeps the stored value, and asks first.
