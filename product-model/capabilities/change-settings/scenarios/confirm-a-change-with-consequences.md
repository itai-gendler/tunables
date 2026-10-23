---
kind: edge
routes:
  screens: Screens
steps:
  - text: The Administrator saves a change the settings group says has consequences, such as one that redoes work already done
    kind: actor
    actor: administrator
    entities:
      - { entity: settings-group, effect: reads, facts: [Values] }
    contexts:
      screens:
        place: embedded-screens::settings-group
  - text: The Product checks the change and, instead of saving it, says what it will cause and asks to confirm
    kind: product
    actor: administrator
    entities:
      - { entity: settings-group, effect: reads, facts: [Confirmation] }
    contexts:
      screens:
        place: embedded-screens::settings-group
  - text: The Administrator confirms
    kind: actor
    actor: administrator
    entities: []
    contexts:
      screens:
        place: embedded-screens::settings-group
  - text: The Product saves the change
    kind: product
    actor: administrator
    entities:
      - { entity: settings-group, effect: changes, facts: [Values, Changed at, Changed by] }
    contexts:
      screens:
        place: embedded-screens::settings-group
---

# Confirm a change with consequences

## Trigger

A change would cost something beyond itself, and the group declares what to
confirm.

## Outcome

The change is saved only after the Administrator has read what it causes and
confirmed it.

## Edge cases

- Cancelling saves nothing and keeps the edited values on the screen.
- A change the group does not ask to confirm saves at once.
