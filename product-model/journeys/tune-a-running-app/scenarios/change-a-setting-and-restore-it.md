---
kind: primary
result: achieved
routes:
  screens: Screens
steps:
  - text: The Administrator finds a setting in All settings and follows the link to where its settings group is edited
    kind: actor
    actor: administrator
    capability: view-all-settings
    entities:
      - { entity: setting, effect: reads, facts: [Label, Section] }
      - { entity: settings-group, effect: reads, facts: [Place] }
    contexts:
      screens:
        place: embedded-screens::all-settings
  - text: The Administrator changes the setting beside what it affects and saves it with a reason
    kind: actor
    actor: administrator
    capability: change-settings
    entities:
      - { entity: settings-group, effect: changes, facts: [Values, Changed at, Changed by] }
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::settings-group
  - text: The Administrator later opens the group's history and reads the change
    kind: actor
    actor: administrator
    capability: review-history
    entities:
      - { entity: revision, effect: reads, facts: [Actor, Reason, Changes, At] }
    contexts:
      screens:
        place: embedded-screens::history
  - text: The Administrator restores the revision from before the change
    kind: actor
    actor: administrator
    capability: restore-revision
    entities:
      - { entity: settings-group, effect: changes, facts: [Values, Changed at, Changed by] }
      - { entity: revision, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::history
---

# Change a setting and restore it

## Trigger

The app should behave differently, and the Administrator is not sure the new
value will be better.

## Outcome

The goal is achieved: the change was made and undone without a deploy, both
recorded, and the app ran within its rules throughout.
