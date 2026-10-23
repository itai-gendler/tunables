---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer asks to install the tunables skills
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product reports which supported harnesses it found
    kind: product
    entities: []
    contexts:
      terminal:
        place: tunables-cli
  - text: The Developer confirms the harnesses and chooses whether this is for the repository or for themselves
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product installs the three skills into each chosen harness and marks the skill installation as its own
    kind: product
    entities:
      - { entity: skill-installation, effect: creates, facts: [Provider, Scope, Version, Skills, Installed at] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product names where it installed and which skills
    kind: product
    entities: []
    contexts:
      terminal:
        place: tunables-cli
---

# Install the skills for detected harnesses

## Trigger

The Developer wants a coding agent to adopt, define or verify tunables in the
app.

## Outcome

Each chosen harness holds the three current skills and a marker recording the
provider, scope, version and skill names. Nothing in the app changed.

## Edge cases

- Without an interactive terminal, harnesses and scope are given explicitly, or detected harnesses and the repository are accepted at once.
- A harness name the Product does not support stops the run and lists the ones it does.
