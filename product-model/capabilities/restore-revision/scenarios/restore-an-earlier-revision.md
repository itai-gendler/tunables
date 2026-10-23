---
kind: primary
routes:
  screens: Screens
  api: API
steps:
  - text: The Administrator chooses an earlier revision of a group to restore, with a reason
    kind: actor
    actor: administrator
    entities:
      - { entity: revision, effect: reads, facts: [Actor, At, Changes] }
    contexts:
      screens:
        place: embedded-screens::history
      api:
        place: http-api
  - text: The Product takes the settings group's values from that revision, and the default of any setting it does not hold
    kind: product
    actor: administrator
    entities:
      - { entity: revision, effect: reads, facts: [Snapshot] }
      - { entity: setting, effect: reads, facts: [Default] }
      - { entity: settings-group, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::history
      api:
        place: http-api
  - text: The Product checks them like any change, asking to confirm when the change has consequences
    kind: product
    actor: administrator
    entities:
      - { entity: settings-group, effect: reads, facts: [Values, Rules, Confirmation] }
    contexts:
      screens:
        place: embedded-screens::history
      api:
        place: http-api
  - text: The Product saves them, with a reason naming the revision restored
    kind: product
    actor: administrator
    entities:
      - { entity: settings-group, effect: changes, facts: [Values, Changed at, Changed by] }
      - { entity: revision, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::history
      api:
        place: http-api
---

# Restore an earlier revision

## Trigger

A change made the app behave worse, and the Administrator wants it as it was.

## Outcome

The group holds the restored values, and the history holds a new revision that
names the one it restored. Nothing earlier is rewritten.

## Edge cases

- The newest revision is what the group already holds, so it offers no restore.
- A revision that does not exist, or that is not of a settings group, is refused by name.
