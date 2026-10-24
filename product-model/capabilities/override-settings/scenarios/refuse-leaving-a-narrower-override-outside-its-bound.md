---
kind: validation
routes:
  screens: Screens
steps:
  - text: A user in the workspace overrides a setting that may be at most what they inherit from the workspace
    kind: condition
    actor: scope-owner
    entities:
      - { entity: override, as: user, effect: reads, facts: [Scope, Values] }
      - { entity: setting, effect: reads, facts: [Override bound] }
    contexts:
      screens:
        place: embedded-screens::scoped-settings
  - text: The Scope owner lowers the workspace's value below the user's own, and saves
    kind: actor
    actor: scope-owner
    entities: []
    contexts:
      screens:
        place: embedded-screens::scoped-settings
  - text: The Product finds every narrower override the change would leave outside its bound
    kind: product
    actor: scope-owner
    entities:
      - { entity: override, as: workspace, effect: reads, facts: [Values] }
      - { entity: override, as: user, effect: reads, facts: [Values] }
    contexts:
      screens:
        place: embedded-screens::scoped-settings
  - text: The Product saves nothing and names each, with the value it keeps and the bound it would break
    kind: product
    actor: scope-owner
    entities:
      - { entity: override, as: user, effect: reads, facts: [Scope] }
    contexts:
      screens:
        place: embedded-screens::scoped-settings
---

# Refuse leaving a narrower override outside its bound

## Trigger

A workspace lowers a value that a user inside it has already set their own
value against.

## Outcome

The workspace's value stays as it was, and the refusal names each user that
would break, such as "User Dana keeps Tasks per list at 400, above 300." Once
those are changed, the same change saves.
