---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer asks for .env.example to be written
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product writes every deployment value under its section and description, commented out at its default, and empty where it must be set
    kind: product
    entities:
      - { entity: deployment-value, effect: reads, facts: [Name, Description, Default, Allowed values, Section] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product names the file and how many values it lists
    kind: product
    entities: []
    contexts:
      terminal:
        place: tunables-cli
---

# List every deployment value

## Trigger

The deployment values changed, or the app has no `.env.example` yet.

## Outcome

`.env.example` lists exactly the declared deployment values.

## Edge cases

- With no deployment values declared, nothing is written and the Product says so.
