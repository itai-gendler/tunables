---
kind: external-failure
routes:
  code: Code
steps:
  - text: The app's database cannot be reached
    kind: condition
    entities: []
    contexts:
      code:
        place: library
  - text: The Host app asks for a group's values, accepting the last good ones
    kind: actor
    actor: host-app
    entities: []
    contexts:
      code:
        place: library
  - text: The Product returns the values this process last read or saved for the group
    kind: product
    entities:
      - { entity: settings-group, effect: reads, facts: [Values] }
    contexts:
      code:
        place: library
---

# Read the last good values

## Trigger

The database is briefly away while the app keeps working.

## Outcome

The host app carries on with values that were checked when they were read.

## Edge cases

- Without asking for the last good values, or before the process has read the group once, the read fails.
