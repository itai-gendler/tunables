---
kind: validation
result: not-achieved
routes:
  repository: Repository
steps:
  - text: The AI agent declares the approved settings
    kind: actor
    actor: ai-agent
    capability: adopt-tunables
    entities:
      - { entity: settings-group, effect: creates, facts: [Title, Description, Place, Rules, Confirmation] }
      - { entity: setting, effect: creates, with: settings-group, facts: [Key, Label, Kind, Unit, Allowed values, Default, Fact, Section, Effects] }
    contexts:
      repository:
        place: agent-skills
  - text: The AI agent checks the definitions, and a default disagrees with the one the Product Model states
    kind: actor
    actor: ai-agent
    capability: check-definitions
    entities:
      - { entity: setting, effect: reads, facts: [Fact, Default] }
    contexts:
      repository:
        place: tunables-cli
  - text: The AI agent reports the disagreement before anything is synced
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      repository:
        place: agent-skills
---

# Stop when the checks fail

## Trigger

The values the app used disagree with what its Product Model says they should
be.

## Outcome

The goal is not achieved yet: nothing is stored, and the Developer decides
whether the code or the Product Model is right before adoption continues.
