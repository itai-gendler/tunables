---
kind: primary
routes:
  code: Code
steps:
  - text: The Host app asks for a group's values where it uses them
    kind: actor
    actor: host-app
    entities: []
    contexts:
      code:
        place: library
  - text: The Product returns every stored value of the group, typed as its kind declares and checked against it
    kind: product
    entities:
      - { entity: settings-group, effect: reads, facts: [Values] }
    contexts:
      code:
        place: library
---

# Read a group's values

## Trigger

The host app is about to do something a setting bounds or shapes.

## Outcome

The host app holds the group's current values, as stored and checked.

## Edge cases

- Reading inside the host app's own transaction sees what that transaction has written.
- A change committed in this process reaches whoever listens to the group at once; another instance of the app sees it on its next read.
