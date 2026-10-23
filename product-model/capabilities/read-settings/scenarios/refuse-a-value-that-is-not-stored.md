---
kind: validation
routes:
  code: Code
steps:
  - text: A settings group, or a setting in it, is declared but not stored, or a stored value no longer passes its check
    kind: condition
    entities:
      - { entity: settings-group, effect: reads, facts: [Values] }
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      code:
        place: library
  - text: The Host app asks for the group's values
    kind: actor
    actor: host-app
    entities: []
    contexts:
      code:
        place: library
  - text: The Product refuses the read, names what is missing or does not hold, and says to run sync for what is missing
    kind: product
    entities: []
    contexts:
      code:
        place: library
---

# Refuse a value that is not stored

## Trigger

The definitions changed and sync has not run, or a stored value was changed
around tunables.

## Outcome

The host app gets no value rather than a guessed one, and the error says what
to do.
