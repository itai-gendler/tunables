---
kind: validation
routes:
  code: Code
steps:
  - text: A deployment value with no default is not set, or one is set to something its kind or allowed values refuse
    kind: condition
    entities:
      - { entity: deployment-value, effect: reads, facts: [Name, Kind, Default, Allowed values] }
    contexts:
      code:
        place: library
  - text: The Host app reads its deployment values
    kind: actor
    actor: host-app
    entities:
      - { entity: deployment-value, effect: reads, facts: [] }
    contexts:
      code:
        place: library
  - text: The Product refuses the read and names every value that is missing or malformed, with what it must be
    kind: product
    entities: []
    contexts:
      code:
        place: library
---

# Refuse a missing deployment value

## Trigger

The environment does not hold what the deployment values declare.

## Outcome

The host app does not start on a guessed value, and the deployment is told every
value to set or fix at once.
