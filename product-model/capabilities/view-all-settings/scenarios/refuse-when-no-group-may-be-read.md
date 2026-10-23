---
kind: validation
routes:
  screens: Screens
  api: API
steps:
  - text: The app's access policy lets this person read no settings group, or nobody is signed in
    kind: condition
    actor: administrator
    entities:
      - { entity: settings-group, effect: reads, facts: [] }
      - { entity: access-policy, effect: reads, facts: [Signed-in person, May read] }
    contexts:
      screens:
        place: embedded-screens::all-settings
      api:
        place: http-api
  - text: Someone opens All settings
    kind: actor
    actor: administrator
    entities:
      - { entity: setting, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::all-settings
      api:
        place: http-api
  - text: The Product refuses as if nothing were there, or as forbidden where the app chose that, and lists no settings group
    kind: product
    actor: administrator
    entities:
      - { entity: access-policy, effect: reads, facts: [Refusal] }
      - { entity: settings-group, effect: reads, facts: [] }
    contexts:
      screens:
        place: embedded-screens::all-settings
      api:
        place: http-api
---

# Refuse when no group may be read

## Trigger

Someone the host app lets read no settings group asks for All settings.

## Outcome

Nothing is listed, and by default the refusal reads as not found, so an
outsider cannot tell the administration exists.
