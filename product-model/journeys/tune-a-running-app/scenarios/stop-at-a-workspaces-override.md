---
kind: validation
result: not-achieved
routes:
  screens: Screens
steps:
  - text: The Administrator finds a limit in All settings and follows the link to where its settings group is edited
    kind: actor
    actor: administrator
    capability: view-all-settings
    entities:
      - { entity: setting, effect: reads, facts: [Label, Section] }
      - { entity: settings-group, effect: reads, facts: [Place] }
    contexts:
      screens:
        place: embedded-screens::all-settings
  - text: The Administrator lowers the system's value below what a workspace has set as its own, and saves
    kind: actor
    actor: administrator
    capability: change-settings
    entities: []
    contexts:
      screens:
        place: embedded-screens::settings-group
  - text: The Product saves nothing and names the workspace's override it would leave outside its bound
    kind: product
    actor: administrator
    capability: change-settings
    entities:
      - { entity: override, effect: reads, facts: [Scope] }
    contexts:
      screens:
        place: embedded-screens::settings-group
---

# Stop at a workspace's override

## Trigger

The Administrator wants a lower system value than a workspace has already set
its own value against.

## Outcome

The goal is not achieved yet: the system's value is unchanged until the
workspace's override is changed first, and no scope ever read a value outside
its bound.
