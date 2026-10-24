---
kind: edge
routes:
  screens: Screens
steps:
  - text: The Scope owner chooses an earlier revision of their scope's values to restore, with a reason
    kind: actor
    actor: scope-owner
    entities:
      - { entity: revision, effect: reads, facts: [Actor, At, Changes] }
    contexts:
      screens:
        place: embedded-screens::history
  - text: The Product checks the scope's override from that revision like any change at the scope, each value against its bound on what the scope inherits now, asking to confirm when the change has consequences
    kind: product
    actor: scope-owner
    entities:
      - { entity: revision, effect: reads, facts: [Snapshot] }
      - { entity: override, effect: reads, facts: [Inherited values] }
      - { entity: setting, effect: reads, facts: [Override scopes, Override bound] }
      - { entity: settings-group, effect: reads, facts: [Rules, Confirmation] }
    contexts:
      screens:
        place: embedded-screens::history
  - text: The Product saves the scope's override as it was, with a reason naming the revision restored
    kind: product
    actor: scope-owner
    entities:
      - { entity: override, effect: changes, facts: [Values, Changed at, Changed by] }
      - { entity: revision, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::history
---

# Restore a scope's revision

## Trigger

A change to a workspace's values made it run worse, and its owner wants them as
they were.

## Outcome

The scope holds the values it overrode after that revision, and a new revision
on the scope names the one it restored. The system's values and other scopes'
are untouched.

## Edge cases

- A restored value that no longer keeps its bound on what the scope inherits now is refused by name.
- An Administrator restores any scope's revision the host app lets them, the same way.
