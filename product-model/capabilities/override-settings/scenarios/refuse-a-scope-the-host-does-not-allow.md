---
kind: validation
routes:
  api: API
steps:
  - text: The app's access policy does not let this person change the group at this scope, such as a workspace other than their own
    kind: condition
    actor: scope-owner
    entities:
      - { entity: access-policy, effect: reads, facts: [Signed-in person, Scope, May change] }
    contexts:
      api:
        place: http-api
  - text: The Scope owner asks to change a settings group at that scope
    kind: actor
    actor: scope-owner
    entities:
      - { entity: settings-group, effect: reads, facts: [] }
    contexts:
      api:
        place: http-api
  - text: The Product answers as if nothing were there, or as forbidden where the app chose that, and changes nothing
    kind: product
    actor: scope-owner
    entities:
      - { entity: access-policy, effect: reads, facts: [Refusal] }
    contexts:
      api:
        place: http-api
---

# Refuse a scope the host does not allow

## Trigger

A workspace owner, or a user, reaches for a scope that is not theirs.

## Outcome

Nothing changes, and by default they cannot tell that scope's values exist.

## Edge cases

- Reading a scope's values or its history is refused the same way.
- A person the host app lets change only their own scope cannot change the system's values.
