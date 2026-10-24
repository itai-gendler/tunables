---
kind: edge
routes:
  screens: Screens
steps:
  - text: The workspace overrides a setting, and a user in it has no values of their own in the group
    kind: condition
    actor: scope-owner
    entities:
      - { entity: override, as: workspace, effect: reads, facts: [Scope, Values] }
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::scoped-settings
  - text: The Scope owner opens their own settings inside the workspace, sets their own value with a reason, and saves
    kind: actor
    actor: scope-owner
    entities:
      - { entity: setting, effect: reads, facts: [Label, Override bound] }
    contexts:
      screens:
        place: embedded-screens::scoped-settings
  - text: The Product checks the value's bound against what the user inherits, the workspace's own value
    kind: product
    actor: scope-owner
    entities:
      - { entity: override, as: workspace, effect: reads, facts: [Values] }
      - { entity: setting, effect: reads, facts: [Override bound] }
    contexts:
      screens:
        place: embedded-screens::scoped-settings
  - text: The Product keeps a new override for the user holding that setting alone
    kind: product
    actor: scope-owner
    entities:
      - { entity: override, as: user, effect: creates, facts: [Group, Scope, Values, Changed at, Changed by] }
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::scoped-settings
---

# Override a value for a user

## Trigger

A person wants one setting to suit them, such as their digest at 07:00, inside
a workspace that has values of its own.

## Outcome

The user reads their own value for that setting and inherits every other
through their workspace, the workspace's plan and the system.

## Edge cases

- A user's values always sit inside their workspace: a scope that names a user without their workspace is refused.
- The same person in another workspace inherits that workspace's values, not their own from here.
