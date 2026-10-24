---
kind: edge
routes:
  screens: Screens
  api: API
steps:
  - text: The Scope owner opens the history of their scope's values from where they edit them
    kind: actor
    actor: scope-owner
    entities:
      - { entity: revision, effect: reads, facts: [Target] }
    contexts:
      screens:
        place: embedded-screens::history
      api:
        place: http-api
  - text: The Product lists that scope's revisions of the group newest first, each with who made it, when, why, and each value before and after
    kind: product
    actor: scope-owner
    entities:
      - { entity: revision, effect: reads, facts: [Target, Actor, Reason, Changes, At] }
    contexts:
      screens:
        place: embedded-screens::history
      api:
        place: http-api
---

# Read a scope's history

## Trigger

A workspace owner wants to know who changed their workspace's values, and why.

## Outcome

They read every change made at their scope, most recent first; the system's
history and other scopes' stay where they are.

## Edge cases

- Reading a scope's history is allowed as reading that scope's values is.
