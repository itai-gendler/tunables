---
kind: edge
routes:
  terminal: Terminal
steps:
  - text: The Developer sets values of a settings group from a terminal, with a reason
    kind: actor
    actor: developer
    entities:
      - { entity: settings-group, effect: reads, facts: [] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product checks the change exactly as it checks a save from the screens
    kind: product
    actor: developer
    entities:
      - { entity: settings-group, effect: reads, facts: [Values, Rules] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product saves it under the Developer's terminal name, with the reason, and prints the id it was recorded under
    kind: product
    actor: developer
    entities:
      - { entity: settings-group, effect: changes, facts: [Values, Changed at, Changed by] }
    contexts:
      terminal:
        place: tunables-cli
---

# Change values from a terminal

## Trigger

The Developer needs to change a value where no screen is at hand, such as
during an incident.

## Outcome

The change is checked, saved and recorded exactly as one from the screens,
with the reason it was made.

## Edge cases

- Without a reason nothing is attempted, and the Product says one is needed.
- A change that asks to be confirmed is asked about in an interactive terminal, and needs an explicit yes from a script.
- A refused change prints each problem and fails.
- Given the app's API address and a token, the change goes through the app's HTTP API instead: the app's access policy decides whether the token may make it, and the revision names whoever the app says the token is.
