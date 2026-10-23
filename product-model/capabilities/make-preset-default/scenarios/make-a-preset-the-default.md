---
kind: primary
routes:
  screens: Screens
  api: API
steps:
  - text: The Administrator makes a preset its slot's default
    kind: actor
    actor: administrator
    entities:
      - { entity: preset, as: chosen, effect: reads, facts: [Label, Slot, Default] }
    contexts:
      screens:
        place: embedded-screens::presets
      api:
        place: http-api
  - text: The Product makes it the default, and the slot's former default preset an ordinary one, the change kept in the history of each
    kind: product
    actor: administrator
    entities:
      - { entity: preset, as: chosen, effect: changes, facts: [Default] }
      - { entity: preset, as: former, effect: changes, facts: [Default] }
    contexts:
      screens:
        place: embedded-screens::presets
      api:
        place: http-api
---

# Make a preset the default

## Trigger

A better preset should become what everyone in the slot runs as.

## Outcome

Every subject following the default now runs as the new one; subjects with an
assignment, including one pinned to the former default, keep theirs. The
history of the new default and of the former default each record the change.

## Edge cases

- Making the default the default changes and records nothing.
