---
kind: primary
routes:
  harness: Harness
steps:
  - text: The Developer asks their agent to adopt tunables in the app
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent finds the values the app tunes today and proposes which become settings, in which groups, and which stay deployment values
    kind: actor
    actor: ai-agent
    entities:
      - { entity: setting, effect: reads, facts: [] }
      - { entity: deployment-value, effect: reads, facts: [] }
    contexts:
      harness:
        place: agent-skills
  - text: The Developer approves the proposal
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent declares each approved settings group with its settings at the values the app uses today, and each deployment value
    kind: actor
    actor: ai-agent
    entities:
      - { entity: settings-group, effect: creates, facts: [Title, Description, Place, Rules, Confirmation] }
      - { entity: setting, effect: creates, with: settings-group, facts: [Key, Label, Kind, Unit, Allowed values, Default, Fact, Section, Effects] }
      - { entity: deployment-value, effect: creates, facts: [Name, Kind, Description, Default, Allowed values, Section] }
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent mounts the API and the screens behind the app's own access, reads each value where the app uses it, and checks the definitions
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      harness:
        place: agent-skills
---

# Adopt tunables in an existing app

## Trigger

An app keeps values in constants, environment variables or a settings table of
its own, and changing them takes a deploy or a database edit.

## Outcome

Each value has one home and its current value as its default, the app reads it
through tunables, the screens sit behind the app's own access, and the
definitions pass their checks. Nothing changed until the Developer approved.

## Edge cases

- A value only a deployment decides, such as a lock id, stays in the environment as a deployment value.
- A value already in a settings table of the app's own is moved into a group, not kept in both.
- A value that is not a value at all, such as a protocol constant, stays in code.
- An app that already uses tunables is pointed to defining or verifying instead.
- An app on a database other than Postgres is told tunables cannot store its settings yet, and nothing is written.
