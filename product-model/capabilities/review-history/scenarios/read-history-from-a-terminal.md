---
kind: edge
routes:
  terminal: Terminal
steps:
  - text: The Developer asks for a settings group's history from a terminal
    kind: actor
    actor: developer
    entities:
      - { entity: settings-group, effect: reads, facts: [] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product prints its revisions newest first, each with its id, when, who, why, and each value before and after
    kind: product
    entities:
      - { entity: revision, effect: reads, facts: [Actor, Reason, Changes, At] }
    contexts:
      terminal:
        place: tunables-cli
---

# Read history from a terminal

## Trigger

The Developer wants the revision to restore, or to see what changed during an
incident.

## Outcome

The Developer has each revision's id to restore from, and the twenty most
recent changes unless they ask for more or fewer.
