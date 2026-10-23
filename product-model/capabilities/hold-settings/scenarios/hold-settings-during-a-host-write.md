---
kind: primary
routes:
  code: Code
steps:
  - text: The Host app opens its own transaction to save something a limit bounds, and holds its tunables in it
    kind: actor
    actor: host-app
    entities: []
    contexts:
      code:
        place: library
  - text: The Product makes any change to the stored values wait until that transaction ends
    kind: product
    entities: []
    contexts:
      code:
        place: library
  - text: The Host app reads the limit inside the same transaction and saves its own thing within it
    kind: actor
    actor: host-app
    entities:
      - { entity: settings-group, effect: reads, facts: [Values] }
    contexts:
      code:
        place: library
  - text: Once the host's transaction ends, the waiting change runs and is checked against what it committed
    kind: condition
    entities: []
    contexts:
      code:
        place: library
---

# Hold settings during a host write

## Trigger

An Administrator may lower a limit while the host app is saving something that
limit bounds.

## Outcome

Either the host's write commits under the limit it read, and a lower limit is
then refused by the guard that sees it, or the limit was lowered first and the
host read the lower one.
