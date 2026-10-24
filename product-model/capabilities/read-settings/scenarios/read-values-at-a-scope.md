---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app asks for a group's values at a scope, such as one user inside a workspace
    kind: actor
    actor: host-app
    entities: []
    contexts:
      code:
        place: library
  - text: The Product reads the system's values, the plan the scope is on, and the override of each scope on its path, broadest first
    kind: product
    entities:
      - { entity: settings-group, effect: reads, facts: [Values, Plan] }
      - { entity: assignment, effect: reads, facts: [Subject, Preset] }
      - { entity: preset, effect: reads, facts: [Default, Values] }
      - { entity: override, effect: reads, facts: [Scope, Values] }
    contexts:
      code:
        place: library
  - text: The Product returns each value from the most specific layer that holds it, typed as its kind declares and checked against it
    kind: product
    entities:
      - { entity: setting, effect: reads, facts: [Kind] }
    contexts:
      code:
        place: library
---

# Read values at a scope

## Trigger

The host app is about to do something for one workspace or one user that a
setting bounds or shapes.

## Outcome

The host app holds the values as read at that scope: the user's own where they
set one, else the workspace's, else the workspace's plan, else the system's.

## Edge cases

- Without a scope, the read returns the system's values, as before.
- A scope that overrides nothing reads exactly what it inherits.
- A scope that names a user without their workspace, or a scope the app does not declare, is refused.
