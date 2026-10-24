---
kind: validation
routes:
  screens: Screens
steps:
  - text: A setting may be at most what the workspace inherits for it
    kind: condition
    actor: scope-owner
    entities:
      - { entity: setting, effect: reads, facts: [Override bound] }
      - { entity: override, effect: reads, facts: [Inherited values] }
    contexts:
      screens:
        place: embedded-screens::scoped-settings
  - text: The Scope owner sets the workspace's value above what it inherits, and saves
    kind: actor
    actor: scope-owner
    entities: []
    contexts:
      screens:
        place: embedded-screens::scoped-settings
  - text: The Product saves nothing and says, beside the setting, the most it may be here and that this is what the workspace inherits
    kind: product
    actor: scope-owner
    entities:
      - { entity: setting, effect: reads, facts: [Label] }
    contexts:
      screens:
        place: embedded-screens::scoped-settings
---

# Refuse a value outside its bound

## Trigger

A workspace tries to give itself more than the system or its plan allows, such
as more tasks per list.

## Outcome

Nothing is stored or recorded, and the problem reads beside the setting, such
as "Tasks per list may be at most 500 for Acme, the value it inherits."

## Edge cases

- A setting bound at least what it inherits refuses a lower value the same way.
- A value outside its kind is refused as on the system's settings.
