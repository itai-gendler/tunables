---
kind: validation
routes:
  code: Code
steps:
  - text: A preset uses more than a setting's default would allow
    kind: condition
    actor: host-app
    entities:
      - { entity: preset, effect: reads, facts: [Values] }
      - { entity: setting, effect: reads, facts: [Default] }
    contexts:
      code:
        place: library
  - text: The Host app resets the settings group to its defaults
    kind: actor
    actor: host-app
    entities:
      - { entity: settings-group, effect: reads, facts: [] }
    contexts:
      code:
        place: library
  - text: The Product saves nothing and names the presets the defaults would leave outside the settings
    kind: product
    actor: host-app
    entities:
      - { entity: preset, effect: reads, facts: [Label] }
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      code:
        place: library
---

# Refuse a reset that would not hold

## Trigger

A limit was raised above its default, and a preset now uses the room.

## Outcome

The group stays as it was; a default gets no exemption from the checks.

## Edge cases

- A default that would leave a scope's override outside its bound is refused the same way, naming the scope.
