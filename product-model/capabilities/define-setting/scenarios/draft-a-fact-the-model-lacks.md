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
  - text: The AI agent declares the setting naming its fact, and drafts the fact line the model lacks with tunables model draft, writing nothing into the model
    kind: actor
    actor: ai-agent
    entities:
      - { entity: setting, effect: creates, facts: [Key, Label, Kind, Unit, Allowed values, Default, Fact, Section, Effects] }
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent brings the draft to /pdd-ideate, where the fact is decided
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: Once the Product Model holds the fact, the AI agent runs tunables explain and checks the definitions
    kind: actor
    actor: ai-agent
    entities:
      - { entity: setting, effect: reads, facts: [Fact, Explanation] }
    contexts:
      harness:
        place: agent-skills
---

# Draft a fact the model lacks

## Trigger

The Developer asks for a setting the Product Model does not describe yet.

## Outcome

The setting names its fact, and once `/pdd-ideate` has written that fact into
the model it explains itself in the model's words, with no help written beside
it.

## Edge cases

- Until the fact is decided the definition checks report it as a fact the model does not keep, and the agent says the change is waiting on `/pdd-ideate`.
- Help is written beside a setting only in an app with no Product Model.
