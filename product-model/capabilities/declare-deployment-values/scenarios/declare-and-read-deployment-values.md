---
kind: primary
routes:
  code: Code
steps:
  - text: The Developer declares each deployment value with its kind, description, section, allowed values and default
    kind: actor
    actor: developer
    entities:
      - { entity: deployment-value, effect: creates, facts: [Name, Kind, Description, Default, Allowed values, Section] }
    contexts:
      code:
        place: library
  - text: The Host app reads its deployment values from the environment when it starts
    kind: actor
    actor: host-app
    entities:
      - { entity: deployment-value, effect: reads, facts: [Name, Kind, Default, Allowed values] }
    contexts:
      code:
        place: library
  - text: The Product returns every value typed, at its default where the environment does not set it
    kind: product
    entities: []
    contexts:
      code:
        place: library
---

# Declare and read deployment values

## Trigger

The app needs a value each deployment sets for itself.

## Outcome

The host app holds every deployment value, typed and checked, from one read.

## Edge cases

- Changing or removing a declaration changes what is read and what `.env.example` lists; nothing is stored.
- On or off reads from true, yes, on or 1 and their opposites.
