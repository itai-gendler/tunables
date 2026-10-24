---
kind: edge
routes:
  terminal: Terminal
steps:
  - text: The Developer sets values of a settings group at a scope from a terminal, such as one workspace, with a reason
    kind: actor
    actor: developer
    entities:
      - { entity: settings-group, effect: reads, facts: [] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product checks the change exactly as it checks a save at that scope from the screens
    kind: product
    actor: developer
    entities:
      - { entity: setting, effect: reads, facts: [Kind, Override scopes, Override bound] }
      - { entity: settings-group, effect: reads, facts: [Rules] }
      - { entity: override, effect: reads, facts: [Values, Inherited values] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product saves the scope's override under the Developer's terminal name, with the reason, and prints the id it was recorded under
    kind: product
    actor: developer
    entities:
      - { entity: override, effect: changes, facts: [Values, Changed at, Changed by] }
    contexts:
      terminal:
        place: tunables-cli
---

# Override values from a terminal

## Trigger

The Developer needs one workspace, or one user in it, to run differently where
no screen is at hand, such as while answering a support request.

## Outcome

The scope's override is checked, saved and recorded on that scope exactly as one
made from the screens, with the reason it was made; the system's values and
other scopes' are untouched.

## Edge cases

- Without a reason nothing is attempted, and the Product says one is needed.
- A scope written other than as scope=id pairs, such as workspace=acme,user=dana, is refused before anything is attempted.
- A setting not overridable at that scope, or a value outside its bound on what it inherits, is refused by name, and the command fails.
- A change that asks to be confirmed is asked about in an interactive terminal, and needs an explicit yes from a script.
- Given the app's API address and a token, the change goes through the app's HTTP API, and reaches only a scope the app's access policy allows that token.
