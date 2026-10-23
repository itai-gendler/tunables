---
kind: validation
routes:
  terminal: Terminal
steps:
  - text: The Developer asks to update the tunables skills
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: tunables-cli
  - text: No skill installation in the searched harnesses and scopes carries a valid tunables marker
    kind: condition
    entities:
      - { entity: skill-installation, effect: reads, facts: [] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product reports that it found nothing it owns, names any unmarked skills it saw, and points to installing instead
    kind: product
    entities: []
    contexts:
      terminal:
        place: tunables-cli
---

# Report no managed installation

## Trigger

An update is asked for where tunables never installed, or where the skills were
placed by hand.

## Outcome

Nothing changed, and the Developer is told the command that would make an
installation eligible.
