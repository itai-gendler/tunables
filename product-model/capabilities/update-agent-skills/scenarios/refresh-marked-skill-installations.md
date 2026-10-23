---
kind: primary
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
  - text: The Product finds every skill installation carrying a valid tunables marker, in the repository and in the personal configuration
    kind: product
    entities:
      - { entity: skill-installation, effect: reads, facts: [Provider, Scope, Version, Skills, Installed at] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product replaces the skills in each and refreshes its marker, keeping the original installation date and removing skills no longer shipped
    kind: product
    entities:
      - { entity: skill-installation, effect: changes, facts: [Version, Skills] }
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product names every place it updated
    kind: product
    entities: []
    contexts:
      terminal:
        place: tunables-cli
---

# Refresh marked skill installations

## Trigger

The Developer has a newer tunables command and wants the installed skills to
match it.

## Outcome

Every tunables-marked installation holds the current skills, and no unmarked
directory was discovered, adopted or changed.

## Edge cases

- Asking for only some harnesses, or one scope, narrows the search without changing what counts as eligible.
