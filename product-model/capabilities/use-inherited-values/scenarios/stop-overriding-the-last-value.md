---
kind: edge
routes:
  api: API
steps:
  - text: The scope overrides a single setting of the group
    kind: condition
    actor: scope-owner
    entities:
      - { entity: override, effect: reads, facts: [Values] }
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      api:
        place: http-api
  - text: The Scope owner asks to use the inherited value for it, with a reason
    kind: actor
    actor: scope-owner
    entities: []
    contexts:
      api:
        place: http-api
  - text: The Product checks the change at the scope and removes the scope's override of the group
    kind: product
    actor: scope-owner
    entities:
      - { entity: override, effect: removes }
    contexts:
      api:
        place: http-api
---

# Stop overriding the last value

## Trigger

The last value a scope set of its own in a group goes back to what it inherits.

## Outcome

The scope keeps no override for the group and reads everything it inherits;
its history keeps every revision, the last one included.
