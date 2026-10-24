---
kind: validation
routes:
  api: API
steps:
  - text: The Scope owner saves a value at a scope for a setting not declared overridable there
    kind: actor
    actor: scope-owner
    entities:
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      api:
        place: http-api
  - text: The Product saves nothing and names the setting and the scope it cannot be set for
    kind: product
    actor: scope-owner
    entities:
      - { entity: setting, effect: reads, facts: [Label, Override scopes] }
    contexts:
      api:
        place: http-api
---

# Refuse a setting not overridable here

## Trigger

A client sends a value for a setting the app keeps for the whole system, or
allows only at another scope.

## Outcome

Nothing is stored or recorded, and the refusal names the setting and the scope,
such as "Digest hour cannot be set for Acme."
