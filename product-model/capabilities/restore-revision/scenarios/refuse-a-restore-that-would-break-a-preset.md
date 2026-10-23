---
kind: validation
routes:
  screens: Screens
steps:
  - text: A preset now uses more than the revision's lower limit would allow
    kind: condition
    actor: administrator
    entities:
      - { entity: preset, effect: reads, facts: [Label, Values] }
      - { entity: revision, effect: reads, facts: [Snapshot] }
    contexts:
      screens:
        place: embedded-screens::history
  - text: The Administrator restores that revision
    kind: actor
    actor: administrator
    entities:
      - { entity: revision, effect: reads, facts: [Actor, At] }
    contexts:
      screens:
        place: embedded-screens::history
  - text: The Product saves nothing and names each preset the restored values would leave outside the settings
    kind: product
    actor: administrator
    entities:
      - { entity: preset, effect: reads, facts: [Label] }
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::history
---

# Refuse a restore that would break a preset

## Trigger

Something has come to depend on a value since the revision was made.

## Outcome

The group stays as it is; an earlier state gets no exemption from the checks
the present one must pass.
