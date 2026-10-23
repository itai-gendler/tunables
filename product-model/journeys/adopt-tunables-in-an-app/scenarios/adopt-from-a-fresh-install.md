---
kind: primary
result: achieved
routes:
  repository: Repository
steps:
  - text: The Developer installs the tunables skills for their harness
    kind: actor
    actor: developer
    capability: install-agent-skills
    entities:
      - { entity: skill-installation, effect: creates, facts: [Provider, Scope, Version, Skills, Installed at] }
    contexts:
      repository:
        place: tunables-cli
  - text: The Developer asks their agent to adopt tunables in the app
    kind: actor
    actor: developer
    capability: adopt-tunables
    entities: []
    contexts:
      repository:
        place: agent-skills
  - text: The AI agent proposes the settings groups and deployment values, and declares them once approved
    kind: actor
    actor: ai-agent
    capability: adopt-tunables
    entities:
      - { entity: settings-group, effect: creates, facts: [Title, Description, Place, Rules, Confirmation] }
      - { entity: setting, effect: creates, with: settings-group, facts: [Key, Label, Kind, Unit, Allowed values, Default, Fact, Section, Effects] }
      - { entity: deployment-value, effect: creates, facts: [Name, Kind, Description, Default, Allowed values, Section] }
    contexts:
      repository:
        place: agent-skills
  - text: The Developer runs sync, which stores each new settings group at its defaults
    kind: actor
    actor: developer
    capability: sync-stored-settings
    entities:
      - { entity: settings-group, effect: changes, facts: [Values, Changed at, Changed by] }
    contexts:
      repository:
        place: tunables-cli
  - text: The AI agent checks the definitions, and they pass
    kind: actor
    actor: ai-agent
    capability: check-definitions
    entities:
      - { entity: setting, effect: reads, facts: [Fact, Default] }
    contexts:
      repository:
        place: tunables-cli
---

# Adopt from a fresh install

## Trigger

The Developer wants the app's scattered values in one home, and has not
installed tunables' skills yet.

## Outcome

The goal is achieved: the app's values are declared, stored at their defaults
and checked, and the Developer approved every one before it was written.
