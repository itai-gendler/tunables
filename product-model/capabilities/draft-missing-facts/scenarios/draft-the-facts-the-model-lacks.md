---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer asks for the facts the Product Model lacks to be drafted
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product proposes, per Entity, one fact line for each setting that names no fact the model keeps, with its help and, for a settings group, its default
    kind: product
    entities:
      - { entity: setting, effect: reads, facts: [Key, Label, Fact, Explanation, Default] }
      - { entity: settings-group, effect: reads, facts: [Title] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product prints the draft, or writes it to the file asked for, and leaves the Product Model as it was
    kind: product
    entities: []
    contexts:
      terminal:
        place: tunables-cli
---

# Draft the facts the model lacks

## Trigger

Settings were declared before the Product Model described them.

## Outcome

The Developer holds a draft to decide with `/pdd-ideate`; nothing in the model
changed.

## Edge cases

- When the model describes every setting, the Product says so and drafts nothing.
- A group naming an Entity the model does not have yet is drafted as a new Entity.
