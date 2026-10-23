---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app saves values of a settings group inside its own open transaction, naming who made the change
    kind: actor
    actor: host-app
    entities:
      - { entity: settings-group, effect: reads, facts: [] }
    contexts:
      code:
        place: library
  - text: The Product checks the whole settings group, with the host app's own checks seeing that transaction
    kind: product
    actor: host-app
    entities:
      - { entity: settings-group, effect: reads, facts: [Values, Rules] }
    contexts:
      code:
        place: library
  - text: The Product saves the change so it commits or rolls back with the host app's own writes
    kind: product
    actor: host-app
    entities:
      - { entity: settings-group, effect: changes, facts: [Values, Changed at, Changed by] }
    contexts:
      code:
        place: library
---

# Save inside a host transaction

## Trigger

The host app changes a setting as part of a change of its own, such as from its
own administration.

## Outcome

The change and the host's own writes commit together or not at all, and
whoever listens to the group in this process hears the new values only once it
has committed.
