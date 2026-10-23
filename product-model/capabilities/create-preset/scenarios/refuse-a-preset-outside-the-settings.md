---
kind: validation
routes:
  screens: Screens
steps:
  - text: The Administrator saves a new preset whose values go beyond what the settings allow, such as a budget above the budget limit
    kind: actor
    actor: administrator
    entities:
      - { entity: preset, effect: reads, facts: [] }
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::preset-editor
  - text: The Product creates nothing and names each value the settings do not allow
    kind: product
    actor: administrator
    entities:
      - { entity: settings-group, effect: reads, facts: [Values] }
      - { entity: setting, effect: reads, facts: [Label] }
    contexts:
      screens:
        place: embedded-screens::preset-editor
---

# Refuse a preset outside the settings

## Trigger

A preset asks for more than the limits the settings groups set.

## Outcome

Nothing is created; the editor keeps the values with each problem beside its
setting.
