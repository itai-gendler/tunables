---
kind: edge
routes:
  terminal: Terminal
steps:
  - text: The Developer asks from a terminal for a settings group's values at a scope, such as one user inside a workspace, or for one setting of it
    kind: actor
    actor: developer
    entities:
      - { entity: settings-group, effect: reads, facts: [] }
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product prints each value as read at that scope, and beside each setting the scope may set either where it is inherited from or that it is set here and what it would inherit
    kind: product
    actor: developer
    entities:
      - { entity: override, effect: reads, facts: [Scope, Values, Inherited values] }
      - { entity: setting, effect: reads, facts: [Key, Override scopes] }
    contexts:
      terminal:
        place: tunables-cli
---

# Read a scope's values at the terminal

## Trigger

The Developer wants to know what one workspace or one person runs with, and
why, such as before changing it or the plan it is on.

## Outcome

The Developer sees the values that scope reads and which layer each comes from,
and nothing is changed.

## Edge cases

- The values as read at the scope are also given as JSON for a script.
- A scope the app does not declare, or one that names a user without their workspace, is refused.
- Given the app's API address and a token, the values are read through the app's HTTP API, at a scope its access policy allows that token.
