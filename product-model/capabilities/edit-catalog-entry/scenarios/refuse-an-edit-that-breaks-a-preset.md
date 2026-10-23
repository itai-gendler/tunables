---
kind: validation
routes:
  screens: Screens
steps:
  - text: A preset's rules depend on the catalog entry, such as an effort level the entry must offer
    kind: condition
    actor: administrator
    entities:
      - { entity: preset, effect: reads, facts: [Label, Values] }
      - { entity: catalog-entry, effect: reads, facts: [Values] }
    contexts:
      screens:
        place: embedded-screens::catalog
  - text: The Administrator edits the catalog entry so that something relying on it would no longer hold
    kind: actor
    actor: administrator
    entities:
      - { entity: catalog-entry, effect: reads, facts: [Id, Values] }
    contexts:
      screens:
        place: embedded-screens::catalog
  - text: The Product saves nothing and names each preset the edit would break
    kind: product
    actor: administrator
    entities:
      - { entity: preset, effect: reads, facts: [Label] }
    contexts:
      screens:
        place: embedded-screens::catalog
---

# Refuse an edit that breaks a preset

## Trigger

An entry is about to stop offering something a preset relies on.

## Outcome

The entry stays as it was until the presets that rely on it are changed.
