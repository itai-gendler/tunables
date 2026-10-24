---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app saves values of a settings group at a scope, inside its own open transaction, naming who made the change
    kind: actor
    actor: host-app
    entities:
      - { entity: settings-group, effect: reads, facts: [] }
    contexts:
      code:
        place: library
  - text: The Product checks the change exactly as from the screens, with the host app's own checks given the scope and seeing that transaction
    kind: product
    actor: host-app
    entities:
      - { entity: override, effect: reads, facts: [Values, Inherited values] }
      - { entity: settings-group, effect: reads, facts: [Rules] }
      - { entity: setting, effect: reads, facts: [Override scopes, Override bound] }
    contexts:
      code:
        place: library
  - text: The Product saves the scope's override so it commits or rolls back with the host app's own writes
    kind: product
    actor: host-app
    entities:
      - { entity: override, effect: changes, facts: [Values, Changed at, Changed by] }
    contexts:
      code:
        place: library
---

# Override settings from code

## Trigger

The host app sets a scope's values as part of a change of its own, such as when
a workspace is created with values of its own.

## Outcome

The change is checked and recorded on the scope exactly as one made through the
screens, under the actor the host app names, or under none when it names nobody.
