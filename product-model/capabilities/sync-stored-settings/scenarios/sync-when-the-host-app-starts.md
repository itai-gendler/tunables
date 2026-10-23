---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app syncs its tunables as it starts or deploys
    kind: actor
    actor: host-app
    entities: []
    contexts:
      code:
        place: library
  - text: The Product stores each new settings group and setting at its default
    kind: product
    actor: host-app
    entities:
      - { entity: settings-group, effect: changes, facts: [Values, Changed at, Changed by] }
      - { entity: setting, effect: reads, facts: [Default] }
    contexts:
      code:
        place: library
  - text: The Product creates each missing slot default preset and fills each empty catalog
    kind: product
    actor: host-app
    entities:
      - { entity: preset, effect: creates, facts: [Set, Key, Slot, Label, Default, Values] }
      - { entity: catalog-entry, effect: creates, to: Available, facts: [Catalog, Id, Values] }
    contexts:
      code:
        place: library
---

# Sync when the host app starts

## Trigger

The host app syncs on every start or deploy instead of leaving it to a person.

## Outcome

The same as a sync from the terminal, inside one transaction, with the report
returned to the host app.
