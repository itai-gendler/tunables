---
kind: edge
routes:
  terminal: Terminal
steps:
  - text: A stored settings group holds a value no definition declares any more
    kind: condition
    entities:
      - { entity: settings-group, effect: reads, facts: [Values] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Developer runs sync
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product keeps the stored value and reports it as stored but declared by nothing
    kind: product
    entities: []
    contexts:
      terminal:
        place: tunables-cli
---

# Keep stored settings nobody declares

## Trigger

A setting was removed or renamed in the definitions after its value was stored.

## Outcome

Nothing stored is dropped. The Developer knows which stored values no
definition reads, and a setting declared again under its old key finds its value
waiting.
