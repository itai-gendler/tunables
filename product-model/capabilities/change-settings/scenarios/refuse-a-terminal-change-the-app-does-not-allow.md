---
kind: validation
routes:
  terminal: Terminal
steps:
  - text: The app's access policy does not let the token a terminal sends change a settings group, or the API address is wrong
    kind: condition
    actor: developer
    entities:
      - { entity: access-policy, effect: reads, facts: [Signed-in person, May change] }
      - { entity: settings-group, effect: reads, facts: [] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Developer sets values of the group from a terminal through the app's API address, with a reason
    kind: actor
    actor: developer
    entities:
      - { entity: settings-group, effect: reads, facts: [] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product changes nothing, prints the address and what it answered, and says to check the address and that the token is one the app allows this
    kind: product
    actor: developer
    entities:
      - { entity: access-policy, effect: reads, facts: [Refusal] }
    contexts:
      terminal:
        place: tunables-cli
---

# Refuse a terminal change the app does not allow

## Trigger

The Developer changes a running app's values through its API, with a token the
app does not allow this, or at the wrong address.

## Outcome

Nothing changes and the command fails, saying which address answered what. An
app that answers refusals as if nothing were there gives the same answer for a
wrong address and a refused token, so the message names both.

## Edge cases

- Without a token, the message says to set one.
