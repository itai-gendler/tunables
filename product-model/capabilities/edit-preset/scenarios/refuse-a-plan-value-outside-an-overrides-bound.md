---
kind: validation
routes:
  screens: Screens
steps:
  - text: The preset is a plan some workspace is on, and that workspace overrides a setting that may be at most what it inherits
    kind: condition
    actor: administrator
    entities:
      - { entity: assignment, effect: reads, facts: [Subject, Preset] }
      - { entity: preset, effect: reads, facts: [] }
      - { entity: override, effect: reads, facts: [Scope, Values] }
      - { entity: setting, effect: reads, facts: [Override bound] }
    contexts:
      screens:
        place: embedded-screens::preset-editor
  - text: The Administrator lowers that value of the preset below the workspace's own, and saves
    kind: actor
    actor: administrator
    entities:
      - { entity: preset, effect: reads, facts: [Label, Values] }
    contexts:
      screens:
        place: embedded-screens::preset-editor
  - text: The Product saves nothing and names each override the lower value would leave outside its bound
    kind: product
    actor: administrator
    entities:
      - { entity: override, effect: reads, facts: [Scope] }
    contexts:
      screens:
        place: embedded-screens::preset-editor
---

# Refuse a plan value outside an override's bound

## Trigger

A plan is made smaller while a workspace on it, or a user inside one, keeps
more than the smaller plan would give.

## Outcome

The preset stays as it was until each override named is changed.
