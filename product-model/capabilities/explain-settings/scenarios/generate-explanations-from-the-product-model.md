---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer asks for the explanations to be generated
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product reads each Entity's facts from the Product Model, with the description and the default each states
    kind: product
    entities: []
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product writes the explanation every setting shows beside its label, and says how many facts it wrote from how many Entities
    kind: product
    entities:
      - { entity: setting, effect: changes, facts: [Explanation] }
    contexts:
      terminal:
        place: tunables-cli
---

# Generate explanations from the Product Model

## Trigger

The Product Model's facts changed, or a setting now names a fact.

## Outcome

Every setting that names a fact explains itself in the model's words; the model
itself is unchanged.

## Edge cases

- Asking only whether the explanations are up to date writes nothing and fails when they are not.
