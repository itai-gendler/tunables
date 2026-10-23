---
kind: validation
routes:
  terminal: Terminal
steps:
  - text: The app has no Product Model, or names no file to write the explanations to
    kind: condition
    entities: []
    contexts:
      terminal:
        place: tunables-cli
  - text: The Developer asks for the explanations to be generated
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product writes nothing and says what is missing
    kind: product
    entities: []
    contexts:
      terminal:
        place: tunables-cli
---

# Refuse without a Product Model

## Trigger

Explanations are asked for where there is nothing to explain from, or nowhere
to write them.

## Outcome

Nothing is written; settings keep the help written beside them.
