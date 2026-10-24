---
kind: validation
routes:
  api: API
steps:
  - text: The preset set is the plan of a settings group at the workspace, and a user in the workspace overrides a setting that may be at most what they inherit
    kind: condition
    actor: administrator
    entities:
      - { entity: settings-group, effect: reads, facts: [Plan] }
      - { entity: preset, effect: reads, facts: [] }
      - { entity: override, effect: reads, facts: [Scope, Values] }
      - { entity: setting, effect: reads, facts: [Override bound] }
    contexts:
      api:
        place: http-api
  - text: The Administrator assigns the workspace a preset whose value is lower than the user's own
    kind: actor
    actor: administrator
    entities:
      - { entity: assignment, effect: reads, facts: [Subject, Preset] }
      - { entity: preset, effect: reads, facts: [Values] }
    contexts:
      api:
        place: http-api
  - text: The Product assigns nothing and names each override the new plan would leave outside its bound
    kind: product
    actor: administrator
    entities:
      - { entity: override, effect: reads, facts: [Scope] }
    contexts:
      api:
        place: http-api
---

# Refuse a plan that leaves an override outside its bound

## Trigger

A workspace is moved to a smaller plan while a scope inside it keeps more than
that plan gives.

## Outcome

The workspace stays on its plan until each override named is changed.

## Edge cases

- Returning the workspace to the slot's default is refused the same way when the default would break an override.
- The workspace's own override is checked against the new plan the same way.
