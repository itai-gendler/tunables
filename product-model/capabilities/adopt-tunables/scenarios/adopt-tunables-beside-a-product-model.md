---
kind: edge
routes:
  harness: Harness
steps:
  - text: The app has a Product Model that does not describe some of the proposed settings
    kind: condition
    entities:
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      harness:
        place: agent-skills
  - text: The Developer asks their agent to adopt tunables in the app
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent names each setting after the Product Model fact it is, and drafts the facts the model lacks
    kind: actor
    actor: ai-agent
    entities:
      - { entity: setting, effect: reads, facts: [Fact] }
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent hands the draft to the Product Model's own ideation and writes nothing into the model itself
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      harness:
        place: agent-skills
---

# Adopt tunables beside a Product Model

## Trigger

The app keeps a pdd-kit Product Model, so its settings should explain
themselves in the model's words.

## Outcome

Every setting names its fact; the facts the model lacks wait as a draft for
the Developer to decide with `/pdd-ideate`.
