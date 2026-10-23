---
kind: edge
routes:
  harness: Harness
steps:
  - text: The app's Product Model does not describe the new setting's fact
    kind: condition
    entities:
      - { entity: setting, effect: reads, facts: [Fact] }
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent drafts the missing fact and hands it to the Product Model's own ideation, writing nothing into the model
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      harness:
        place: agent-skills
---

# Draft a fact the model lacks

## Trigger

The Developer asks for a setting the Product Model does not describe yet.

## Outcome

The setting is declared with help written beside it until the Developer
decides the fact with `/pdd-ideate` and the explanations are generated.
