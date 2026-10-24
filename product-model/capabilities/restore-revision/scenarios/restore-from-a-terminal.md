---
kind: edge
routes:
  terminal: Terminal
steps:
  - text: The Developer restores a revision from a terminal, with a reason
    kind: actor
    actor: developer
    entities:
      - { entity: revision, effect: reads, facts: [Snapshot] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product checks the restored values like any change and saves them under the Developer's terminal name
    kind: product
    actor: developer
    entities:
      - { entity: settings-group, effect: changes, facts: [Values, Changed at, Changed by] }
    contexts:
      terminal:
        place: tunables-cli
---

# Restore from a terminal

## Trigger

The Developer needs a group back as it was where no screen is at hand.

## Outcome

The group is restored, checked and recorded exactly as from the screens, with
the reason it was restored.

## Edge cases

- Without a reason nothing is attempted, and the Product says one is needed.
- A restore that asks to be confirmed needs an explicit yes.
- A scope's revision puts back that scope's own values exactly, checked like any change at that scope.
- Given the app's API address and a token, the restore goes through the app's HTTP API, allowed and recorded as the app says for that token.
