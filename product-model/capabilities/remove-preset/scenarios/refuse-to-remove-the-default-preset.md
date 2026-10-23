---
kind: validation
routes:
  api: API
steps:
  - text: The Administrator asks to remove the preset that is its slot's default
    kind: actor
    actor: administrator
    entities:
      - { entity: preset, effect: reads, facts: [Label, Default] }
    contexts:
      api:
        place: http-api
  - text: The Product removes nothing and says to make another preset the default first
    kind: product
    actor: administrator
    entities:
      - { entity: preset, effect: reads, facts: [] }
    contexts:
      api:
        place: http-api
---

# Refuse to remove the default preset

## Trigger

The slot's default is asked to be removed.

## Outcome

The slot keeps its default, so every subject still resolves to a preset.

## Edge cases

- The screens offer no way to remove the default, only to make another the default.
