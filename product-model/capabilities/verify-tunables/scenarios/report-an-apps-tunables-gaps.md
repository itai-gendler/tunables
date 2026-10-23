---
kind: primary
routes:
  harness: Harness
steps:
  - text: The Developer asks their agent to verify the app's tunables
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent runs the definition checks and reads the app for values kept in two homes, defaults copied outside their definition, and values read or changed around tunables
    kind: actor
    actor: ai-agent
    entities:
      - { entity: setting, effect: reads, facts: [Default] }
      - { entity: deployment-value, effect: reads, facts: [Name, Default] }
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent reports each gap with where it is, and fixes the ones chosen
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      harness:
        place: agent-skills
---

# Report an app's tunables gaps

## Trigger

Before a release, after a refactor, or when a value seems to come from
somewhere unexpected.

## Outcome

The Developer knows every place the app does not keep what tunables promises,
and the gaps they chose are fixed.

## Edge cases

- An app with no gaps is reported as such, naming what was checked.
- Asked to report only, the agent changes nothing.
- A gap whose fix is a product decision, such as a value's home or its default, is reported as needing the Developer's decision.
- The check can be narrowed to one group, one value, a path, or what a branch changed.
- A gap in the Product Model is reported for its own ideation, never written there.
