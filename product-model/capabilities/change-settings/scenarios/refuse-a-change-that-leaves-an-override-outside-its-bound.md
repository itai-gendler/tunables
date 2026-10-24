---
kind: validation
routes:
  screens: Screens
steps:
  - text: A workspace overrides a setting that may be at most what it inherits
    kind: condition
    actor: administrator
    entities:
      - { entity: override, effect: reads, facts: [Scope, Values] }
      - { entity: setting, effect: reads, facts: [Override bound] }
    contexts:
      screens:
        place: embedded-screens::settings-group
  - text: The Administrator lowers the system's value below the workspace's own, and saves
    kind: actor
    actor: administrator
    entities: []
    contexts:
      screens:
        place: embedded-screens::settings-group
  - text: The Product finds every override the lower value would leave outside its bound
    kind: product
    actor: administrator
    entities:
      - { entity: settings-group, effect: reads, facts: [Values] }
      - { entity: override, effect: reads, facts: [Values] }
    contexts:
      screens:
        place: embedded-screens::settings-group
  - text: The Product saves nothing and names each, with the value it keeps and the bound it would break
    kind: product
    actor: administrator
    entities:
      - { entity: override, effect: reads, facts: [Scope] }
    contexts:
      screens:
        place: embedded-screens::settings-group
---

# Refuse a change that leaves an override outside its bound

## Trigger

An Administrator lowers a value a workspace has already set its own value
against.

## Outcome

The system's value stays as it was, and the refusal names each scope that would
break, such as "Workspace Acme keeps Tasks per list at 800, above 500." Once
those are changed, the same change saves.

## Edge cases

- Raising a value above an override bound at least what it inherits is refused the same way.
- A reset or a restore of the system's values is refused the same way.
