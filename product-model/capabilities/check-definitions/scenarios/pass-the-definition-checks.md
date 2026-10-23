---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer asks for the definitions to be checked
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product checks, without a database, that the definitions hold, .env.example lists every deployment value, the explanations match the Product Model, and each setting's fact and default agree with it
    kind: product
    entities:
      - { entity: setting, effect: reads, facts: [Fact, Default, Explanation] }
      - { entity: deployment-value, effect: reads, facts: [Name, Description, Default, Allowed values, Section] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product names each check that passed and succeeds
    kind: product
    entities: []
    contexts:
      terminal:
        place: tunables-cli
---

# Pass the definition checks

## Trigger

The Developer is about to commit a change to the definitions, or a pipeline
runs on it.

## Outcome

The check succeeds and says what it checked.

## Edge cases

- A check whose subject the app does not have, such as deployment values or a Product Model, is skipped.
- The result is also given as structured findings for a pipeline or an agent.
