---
kind: edge
routes:
  terminal: Terminal
steps:
  - text: The Developer names, from a terminal, settings a scope should inherit again, with a reason
    kind: actor
    actor: developer
    entities:
      - { entity: override, effect: reads, facts: [Scope, Values] }
      - { entity: setting, effect: reads, facts: [Key] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product checks the change at the scope like any change there
    kind: product
    actor: developer
    entities:
      - { entity: settings-group, effect: reads, facts: [Rules] }
      - { entity: override, effect: reads, facts: [Inherited values] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product takes those settings out of the scope's override under the Developer's terminal name, and prints the id it was recorded under
    kind: product
    actor: developer
    entities:
      - { entity: override, effect: changes, facts: [Values, Changed at, Changed by] }
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      terminal:
        place: tunables-cli
---

# Use inherited values from a terminal

## Trigger

A workspace or a user should read again what it inherits, and no screen is at
hand.

## Outcome

Those settings read what the scope inherits, and the scope's history holds one
revision of the change with its reason.

## Edge cases

- Naming settings to inherit without a scope is refused: only a scope inherits.
- The same command may set some settings at the scope and return others to what they inherit, as one change.
- A scope left overriding nothing in the group keeps no override for it.
- Given the app's API address and a token, the change goes through the app's HTTP API, allowed and recorded as the app says for that token.
