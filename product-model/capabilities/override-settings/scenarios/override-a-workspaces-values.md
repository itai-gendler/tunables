---
kind: primary
routes:
  screens: Screens
  api: API
steps:
  - text: The Scope owner opens their workspace's settings and reads each setting it may override, the value it reads here, what it inherits and where that comes from
    kind: actor
    actor: scope-owner
    entities:
      - { entity: settings-group, effect: reads, facts: [Title, Description] }
      - { entity: override, effect: reads, facts: [Scope, Values, Inherited values, Changed at, Changed by] }
      - { entity: setting, effect: reads, facts: [Label, Unit, Default, Explanation, Section, Effects, Override bound] }
    contexts:
      screens:
        place: embedded-screens::scoped-settings
      api:
        place: http-api
  - text: The Scope owner changes values and saves them for the workspace with a reason
    kind: actor
    actor: scope-owner
    entities: []
    contexts:
      screens:
        place: embedded-screens::scoped-settings
      api:
        place: http-api
  - text: The Product asks the app's access policy whether this person may change the group at this scope
    kind: product
    actor: scope-owner
    entities:
      - { entity: access-policy, effect: reads, facts: [Signed-in person, Scope, May change] }
    contexts:
      screens:
        place: embedded-screens::scoped-settings
      api:
        place: http-api
  - text: The Product checks that each setting may be overridden here, each value against its kind and its bound on what it inherits, the group's rules on the values as read at this scope, and the app's own checks given the scope
    kind: product
    actor: scope-owner
    entities:
      - { entity: setting, effect: reads, facts: [Kind, Unit, Allowed values, Override scopes, Override bound] }
      - { entity: settings-group, effect: reads, facts: [Rules] }
      - { entity: override, effect: reads, facts: [Values, Inherited values] }
    contexts:
      screens:
        place: embedded-screens::scoped-settings
      api:
        place: http-api
  - text: The Product saves the workspace's override and shows each value as read here, with who changed it and when
    kind: product
    actor: scope-owner
    entities:
      - { entity: override, effect: changes, facts: [Values, Changed at, Changed by] }
    contexts:
      screens:
        place: embedded-screens::scoped-settings
      api:
        place: http-api
---

# Override a workspace's values

## Trigger

A workspace needs to run differently from the rest of the app, such as keeping
fewer tasks per list.

## Outcome

The workspace reads its own values for the settings it overrides and inherits
the rest; the system's values are untouched, and the workspace's history holds
one revision with who, when, why and each value before and after.

## Edge cases

- An Administrator overrides any scope the host app lets them, from the same screen or the API.
- A change the group asks to confirm compares the values as read at the scope before and after, and is saved only once confirmed.
- Saving values that change nothing stores and records nothing.
- Only the values sent change; the scope's other overrides stay as they are.
- Leaving the screen with unsaved changes asks first.
