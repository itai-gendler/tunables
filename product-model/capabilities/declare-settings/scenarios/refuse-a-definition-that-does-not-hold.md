---
kind: validation
routes:
  code: Code
steps:
  - text: A setting is measured in a unit nobody declared, picks from a catalog that does not exist, affects an undeclared effect, or has a default its own check refuses
    kind: condition
    entities:
      - { entity: setting, effect: reads, facts: [Unit, Allowed values, Default, Effects] }
    contexts:
      code:
        place: library
  - text: The Host app creates its tunables from the definitions
    kind: actor
    actor: host-app
    entities: []
    contexts:
      code:
        place: library
  - text: The Product refuses to create them and names what to declare or fix, and where
    kind: product
    entities: []
    contexts:
      code:
        place: library
---

# Refuse a definition that does not hold

## Trigger

A declaration contradicts itself or names something that is not declared.

## Outcome

The host app cannot start with definitions that do not hold, and the Developer
knows exactly which setting to fix.

## Edge cases

- Two groups, preset sets or catalogs with one id are refused the same way.
- A preset set with no slots is refused.
