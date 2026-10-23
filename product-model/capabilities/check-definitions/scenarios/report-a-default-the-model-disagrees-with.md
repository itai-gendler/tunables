---
kind: validation
routes:
  terminal: Terminal
steps:
  - text: A setting's default differs from the one its Product Model fact states, or it names a fact the model does not keep
    kind: condition
    entities:
      - { entity: setting, effect: reads, facts: [Fact, Default] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The AI agent checks the definitions while working on the app's tunables
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product names each setting with what the model says instead, and fails
    kind: product
    entities:
      - { entity: setting, effect: reads, facts: [Key, Fact, Default] }
    contexts:
      terminal:
        place: tunables-cli
---

# Report a default the model disagrees with

## Trigger

A default was changed in code without the Product Model, or the model without
the code.

## Outcome

The check fails, naming each disagreement, until the code or the model is
changed to match.

## Edge cases

- A stale `.env.example` or explanations fails the same way and names the command that rewrites it.
- Definitions that do not hold fail the check before anything is compared.
