---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app restores an earlier revision of a settings group, with a reason
    kind: actor
    actor: host-app
    entities:
      - { entity: settings-group, effect: reads, facts: [] }
      - { entity: revision, effect: reads, facts: [Snapshot] }
    contexts:
      code:
        place: library
  - text: The Product checks the restored values like any change, asking to confirm when the change has consequences
    kind: product
    actor: host-app
    entities:
      - { entity: settings-group, effect: reads, facts: [Values, Rules, Confirmation] }
    contexts:
      code:
        place: library
  - text: The Product saves them, with a reason naming the revision restored
    kind: product
    actor: host-app
    entities:
      - { entity: revision, effect: reads, facts: [] }
      - { entity: settings-group, effect: changes, facts: [Values, Changed at, Changed by] }
    contexts:
      code:
        place: library
---

# Restore from the host app's code

## Trigger

The host app puts a group back as it was from its own administration or tooling.

## Outcome

The group holds the restored values, and a new revision names the one it
restored, under the actor the host app names, or under none when it names
nobody.

## Edge cases

- A restore that would break a preset is refused, naming each preset, exactly as on the screens.
