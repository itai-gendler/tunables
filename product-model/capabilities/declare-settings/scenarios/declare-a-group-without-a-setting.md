---
kind: edge
routes:
  code: Code
steps:
  - text: The Developer removes a setting from its group's declaration, or renames its key
    kind: actor
    actor: developer
    entities:
      - { entity: setting, effect: removes }
    contexts:
      code:
        place: library
  - text: The Product reads only what is still declared, and keeps the value stored under the old key
    kind: product
    entities:
      - { entity: settings-group, effect: reads, facts: [Values] }
    contexts:
      code:
        place: library
---

# Declare a group without a setting

## Trigger

A setting is no longer needed, or needs another name.

## Outcome

The host app reads the group without the old setting. Its stored value is kept
and the next sync reports it as stored but undeclared. A renamed setting is a
new one: it starts at its default once synced, and its old value is not carried
over.

## Edge cases

- Removing a whole group from the definitions works the same way: its stored values are kept, and nothing reads them.
