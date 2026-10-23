---
kind: primary
routes:
  screens: Screens
  api: API
steps:
  - text: The Administrator opens the history of something they may read
    kind: actor
    actor: administrator
    entities:
      - { entity: revision, effect: reads, facts: [Target] }
    contexts:
      screens:
        place: embedded-screens::history
      api:
        place: http-api
  - text: The Product lists its revisions newest first, each with who made it, when, why, and each value before and after
    kind: product
    actor: administrator
    entities:
      - { entity: revision, effect: reads, facts: [Target, Actor, Reason, Changes, At] }
    contexts:
      screens:
        place: embedded-screens::history
      api:
        place: http-api
---

# Read a group's history

## Trigger

An Administrator wants to know why the app behaves as it does now, or who
changed a value.

## Outcome

The Administrator reads every change, most recent first, in the words of whoever
made it.

## Edge cases

- Older changes load on request, at most 500 at a time.
- With no changes yet, the history says nothing has changed.
- Reading a history is allowed as reading what it is about is.
