---
kind: edge
routes:
  terminal: Terminal
steps:
  - text: The Developer asks for a settings group's stored values from a terminal, or for one setting of it
    kind: actor
    actor: developer
    entities:
      - { entity: setting, effect: reads, facts: [] }
      - { entity: settings-group, effect: reads, facts: [] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product prints each stored value as it reads to a person, with its default beside it where the two differ
    kind: product
    actor: developer
    entities:
      - { entity: settings-group, effect: reads, facts: [Values] }
      - { entity: setting, effect: reads, facts: [Key, Default] }
    contexts:
      terminal:
        place: tunables-cli
---

# Read values at the terminal

## Trigger

The Developer wants to know what an environment runs with, such as before
tightening a bound or moving a value across.

## Outcome

The Developer sees the group's stored values and which differ from their
defaults, and nothing is changed.

## Edge cases

- The values are also given as JSON for a script.
- A setting the group does not have is refused by name.
- Given the app's API address and a token, the values are read through the app's HTTP API, as far as its access policy allows that token.
