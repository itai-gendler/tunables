---
kind: primary
routes:
  harness: Harness
steps:
  - text: The Developer asks their agent for a new setting, such as a limit the app hard-codes today
    kind: actor
    actor: developer
    entities:
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent proposes whether it is a setting or a deployment value, and its group, kind, unit, default, section, effects and fact
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
  - text: The AI agent declares the setting, reads it where the app uses the value, and checks the definitions
    kind: actor
    actor: ai-agent
    entities:
      - { entity: setting, effect: creates, facts: [Key, Label, Kind, Unit, Allowed values, Default, Fact, Section, Effects] }
    contexts:
      harness:
        place: agent-skills
---

# Define a new setting

## Trigger

The app needs a value an Administrator can change while it runs.

## Outcome

The setting is declared once and read where it is used, and the definitions
pass their checks; it is stored at its default on the next sync.

## Edge cases

- A setting that bounds another in its group gets the rule between them in the same change.
- A changed default leaves every stored value as it is; the agent says what each environment needs, and changes a stored value only through a checked, recorded change.
- A value that is not a value at all, such as a layout measure, stays in code, and the agent says why.
- An app with no tunables yet is pointed to adopting them instead.
- A setting a preset is bounded by gets the preset set's bound in the same change.
