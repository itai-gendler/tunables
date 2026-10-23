---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app syncs its tunables from its deploy or migrate step, after the tables exist and before the new code serves
    kind: actor
    actor: host-app
    entities: []
    contexts:
      code:
        place: library
  - text: The Product stores each new settings group and setting at its default, and adds each setting newly declared on a preset set to every stored preset at its default
    kind: product
    actor: host-app
    entities:
      - { entity: settings-group, effect: changes, facts: [Values, Changed at, Changed by] }
      - { entity: preset, as: stored, effect: changes, facts: [Values] }
      - { entity: setting, effect: reads, facts: [Default] }
    contexts:
      code:
        place: library
  - text: The Product creates each missing slot default preset and fills each empty catalog
    kind: product
    actor: host-app
    entities:
      - { entity: preset, as: seeded, effect: creates, facts: [Set, Key, Slot, Label, Default, Values] }
      - { entity: catalog-entry, effect: creates, to: Available, facts: [Catalog, Id, Values] }
    contexts:
      code:
        place: library
---

# Sync from the deploy step

## Trigger

The host app syncs on every deploy, in the same step that creates or migrates
its tables, instead of leaving it to a person. Starting the app never syncs.

## Outcome

The same as a sync from the terminal, inside one transaction, with the report
returned to the host app. Each revision it records names the actor the host app
gave, and none when it gave none.
