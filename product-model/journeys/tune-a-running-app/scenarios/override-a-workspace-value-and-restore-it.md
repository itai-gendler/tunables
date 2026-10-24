---
kind: primary
result: achieved
routes:
  screens: Screens
steps:
  - text: The Scope owner changes a setting at their workspace's settings, beside what it inherits, and saves it with a reason
    kind: actor
    actor: scope-owner
    capability: override-settings
    entities:
      - { entity: override, effect: changes, facts: [Values, Changed at, Changed by] }
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::scoped-settings
  - text: The Scope owner later opens the workspace's history and reads the change
    kind: actor
    actor: scope-owner
    capability: review-history
    entities:
      - { entity: revision, effect: reads, facts: [Actor, Reason, Changes, At] }
    contexts:
      screens:
        place: embedded-screens::history
  - text: The Scope owner restores the workspace's revision from before the change
    kind: actor
    actor: scope-owner
    capability: restore-revision
    entities:
      - { entity: override, effect: changes, facts: [Values, Changed at, Changed by] }
      - { entity: revision, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::history
---

# Override a workspace value and restore it

## Trigger

A workspace should run differently from the rest of the app, and its owner is
not sure the new value will be better.

## Outcome

The goal is achieved: the workspace's value was changed and undone without a
deploy and without an Administrator, both recorded on the workspace, and the
system's values were never touched.
