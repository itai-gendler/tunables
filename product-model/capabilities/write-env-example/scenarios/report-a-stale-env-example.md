---
kind: edge
routes:
  terminal: Terminal
steps:
  - text: The Developer asks only whether .env.example is up to date
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product compares the file with what the deployment values would write
    kind: product
    entities:
      - { entity: deployment-value, effect: reads, facts: [Name, Description, Default, Allowed values, Section] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product says the file is out of date, names the command that rewrites it, and fails without writing
    kind: product
    entities: []
    contexts:
      terminal:
        place: tunables-cli
---

# Report a stale .env.example

## Trigger

A pipeline or a pre-commit check wants to know the file still matches.

## Outcome

Nothing was written, and the check fails until the file is rewritten.
