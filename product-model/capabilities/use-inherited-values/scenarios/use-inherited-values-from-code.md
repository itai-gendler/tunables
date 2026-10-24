---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app asks for settings of a group at a scope to use their inherited values, naming who made the change
    kind: actor
    actor: host-app
    entities:
      - { entity: override, effect: reads, facts: [Values] }
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      code:
        place: library
  - text: The Product checks the change at the scope and takes those settings out of the scope's override, committed with the host app's own writes
    kind: product
    actor: host-app
    entities:
      - { entity: override, effect: changes, facts: [Values, Changed at, Changed by] }
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      code:
        place: library
---

# Use inherited values from code

## Trigger

The host app returns a scope to what it inherits, such as when a workspace
leaves a trial.

## Outcome

Those settings read what the scope inherits, recorded on the scope under the
actor the host app names, or under none when it names nobody.
