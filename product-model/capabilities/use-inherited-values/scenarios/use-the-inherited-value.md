---
kind: primary
routes:
  screens: Screens
  api: API
steps:
  - text: The Scope owner chooses Use inherited beside a setting their scope overrides, reads what it will inherit and from where, and saves with a reason
    kind: actor
    actor: scope-owner
    entities:
      - { entity: override, effect: reads, facts: [Values, Inherited values] }
      - { entity: setting, effect: reads, facts: [Label] }
    contexts:
      screens:
        place: embedded-screens::scoped-settings
      api:
        place: http-api
  - text: The Product checks the scope's values as read after the change, like any change at the scope
    kind: product
    actor: scope-owner
    entities:
      - { entity: settings-group, effect: reads, facts: [Rules] }
      - { entity: override, effect: reads, facts: [Inherited values] }
    contexts:
      screens:
        place: embedded-screens::scoped-settings
      api:
        place: http-api
  - text: The Product takes the setting out of the scope's override, so it reads what the scope inherits
    kind: product
    actor: scope-owner
    entities:
      - { entity: override, effect: changes, facts: [Values, Changed at, Changed by] }
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::scoped-settings
      api:
        place: http-api
---

# Use the inherited value

## Trigger

A workspace or a user no longer needs a value of its own for a setting.

## Outcome

The setting reads what the scope inherits, now and whenever that changes, and
the scope's history holds one revision of the change.

## Edge cases

- Using the inherited value for a setting the scope does not override records nothing.
- A change that would leave a narrower scope's override outside its bound is refused, naming it.
- A change the group asks to confirm compares the values as read at the scope before and after.
