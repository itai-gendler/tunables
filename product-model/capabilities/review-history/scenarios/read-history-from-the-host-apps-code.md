---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app asks for the revisions of a settings group, a preset, a catalog entry or a subject's assignments
    kind: actor
    actor: host-app
    entities:
      - { entity: assignment, effect: reads, facts: [] }
      - { entity: catalog-entry, effect: reads, facts: [] }
      - { entity: preset, effect: reads, facts: [] }
      - { entity: settings-group, effect: reads, facts: [] }
      - { entity: revision, effect: reads, facts: [Target] }
    contexts:
      code:
        place: library
  - text: The Product returns its revisions newest first, each with who made it, when, why, and each value before and after
    kind: product
    actor: host-app
    entities:
      - { entity: revision, effect: reads, facts: [Target, Actor, Reason, Changes, At] }
    contexts:
      code:
        place: library
---

# Read history from the host app's code

## Trigger

The host app shows a history in its own administration, or reports on what
changed.

## Outcome

The host app holds the revisions it asked for, most recent first, with older
ones on request.
