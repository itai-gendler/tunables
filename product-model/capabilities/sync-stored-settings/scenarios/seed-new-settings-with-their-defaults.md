---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer runs sync after declaring something new
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product stores each new settings group with every setting at its default, and adds each new setting to a stored group at its default
    kind: product
    actor: developer
    entities:
      - { entity: settings-group, effect: changes, facts: [Values, Changed at, Changed by] }
      - { entity: setting, effect: reads, facts: [Default] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product creates each slot's default preset where the slot has none, and fills each empty catalog with the entries it starts with
    kind: product
    actor: developer
    entities:
      - { entity: preset, effect: creates, facts: [Set, Key, Slot, Label, Default, Values] }
      - { entity: catalog-entry, effect: creates, to: Available, facts: [Catalog, Id, Values] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product reports what it stored and created, or that everything is in place
    kind: product
    entities: []
    contexts:
      terminal:
        place: tunables-cli
---

# Seed new settings with their defaults

## Trigger

The definitions declare settings, presets or catalogs the database does not
hold yet.

## Outcome

Every declared setting is stored, at its default where it is new; every slot
has a default preset; and every catalog that was empty holds its starting
entries. A stored value is never overwritten.

## Edge cases

- A preset or catalog entry already stored under a seed's key is left as it is.
- Running sync again with nothing new changes nothing and records nothing.
