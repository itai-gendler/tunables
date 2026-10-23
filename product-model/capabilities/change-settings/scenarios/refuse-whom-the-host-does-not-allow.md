---
kind: validation
routes:
  api: API
steps:
  - text: The app's access policy does not let this person change the group, or nobody is signed in
    kind: condition
    actor: administrator
    entities:
      - { entity: access-policy, effect: reads, facts: [Signed-in person, May change] }
    contexts:
      api:
        place: http-api
  - text: Someone asks to change a settings group
    kind: actor
    actor: administrator
    entities:
      - { entity: settings-group, effect: reads, facts: [] }
    contexts:
      api:
        place: http-api
  - text: The Product answers as if nothing were there, or as forbidden where the app chose that, and changes nothing
    kind: product
    actor: administrator
    entities:
      - { entity: access-policy, effect: reads, facts: [Refusal] }
    contexts:
      api:
        place: http-api
---

# Refuse whom the host does not allow

## Trigger

A request reaches the API from someone the host app has not allowed to change
the group.

## Outcome

Nothing changed, and by default an outsider cannot tell the administration
exists.

## Edge cases

- Reading a group, a preset set, a catalog or a history is refused the same way.
- With no access policy given, everyone is refused.
