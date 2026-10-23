---
kind: edge
routes:
  code: Code
steps:
  - text: The Host app removes a preset that is not its slot's default
    kind: actor
    actor: host-app
    entities:
      - { entity: preset, effect: reads, facts: [Default] }
    contexts:
      code:
        place: library
  - text: The Product removes the preset and every assignment of it, the change kept in the history of the preset and of each subject's assignments
    kind: product
    actor: host-app
    entities:
      - { entity: preset, effect: removes }
      - { entity: assignment, effect: removes, with: preset }
    contexts:
      code:
        place: library
---

# Remove a preset from code

## Trigger

The host app removes a preset from its own code.

## Outcome

Every subject assigned the preset follows the slot's default, the host app
learns how many did, and each change is recorded under the actor it names, or
under none.

## Edge cases

- The slot's default is refused, as through the HTTP API.
