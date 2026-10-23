---
kind: conflict
routes:
  terminal: Terminal
steps:
  - text: A directory with a tunables skill's name already exists and is not marked as installed by tunables
    kind: condition
    entities: []
    contexts:
      terminal:
        place: tunables-cli
  - text: The Developer asks to install the tunables skills
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: tunables-cli
  - text: The Product stops before writing anything, names the directory, and explains that replacing it must be asked for explicitly
    kind: product
    entities: []
    contexts:
      terminal:
        place: tunables-cli
---

# Refuse an unowned skill directory

## Trigger

Installing would overwrite a directory that carries a tunables skill name but
no evidence of being a tunables installation.

## Outcome

Nothing on disk changed, and the Developer knows which directory blocked the
install and that only declaring they own it lets it proceed.

## Edge cases

- A marker that cannot be read, or one written by another package, grants nothing; the directory is treated as unowned.
