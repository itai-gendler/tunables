---
kind: primary
routes:
  api: API
steps:
  - text: The Administrator resets the settings named, or the whole group, to the default each declares
    kind: actor
    actor: administrator
    entities:
      - { entity: setting, effect: reads, facts: [Key, Default] }
    contexts:
      api:
        place: http-api
  - text: The Product checks the settings group with those defaults like any change
    kind: product
    actor: administrator
    entities:
      - { entity: settings-group, effect: reads, facts: [Values, Rules] }
    contexts:
      api:
        place: http-api
  - text: The Product saves the defaults, with a reason that names what was reset unless another was given
    kind: product
    actor: administrator
    entities:
      - { entity: settings-group, effect: changes, facts: [Values, Changed at, Changed by] }
    contexts:
      api:
        place: http-api
---

# Reset settings to their defaults

## Trigger

A tuned value turned out worse than the one the app was designed with.

## Outcome

The settings read their declared defaults again, and the history says what was
reset.

## Edge cases

- Resetting settings already at their defaults records nothing.
- The host app's own code resets through the library the same way.
