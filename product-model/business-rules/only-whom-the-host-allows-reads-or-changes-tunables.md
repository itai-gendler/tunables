---
appliesTo:
  - { type: entity, id: settings-group, effect: changes }
  - type: entity
    id: settings-group
    effect: reads
    contexts: [{ place: embedded-screens }, { place: http-api }]
  - type: entity
    id: revision
    effect: reads
    contexts: [{ place: embedded-screens }, { place: http-api }]
  - { type: entity, id: preset, effect: creates }
  - { type: entity, id: preset, effect: changes }
  - { type: entity, id: preset, effect: removes }
  - { type: entity, id: assignment, effect: creates }
  - { type: entity, id: assignment, effect: changes }
  - { type: entity, id: assignment, effect: removes }
  - { type: entity, id: catalog-entry, effect: creates }
  - { type: entity, id: catalog-entry, effect: changes }
permits:
  - actors: [administrator, scope-owner]
    configuredBy: access-policy
  - actors: [host-app]
  - actors: [developer]
references:
  - kind: code
    role: implementation
    target: src/server/service.ts#createService
---

# Only whom the host app allows reads or changes tunables

Through the screens and the HTTP API, a person reads or changes a settings
group, its history, presets, assignments or catalog entries only when the host
app's access policy says, for that request and the scope it names, that they
are signed in and may. A person the host app allows only their own scope, such
as a workspace owner, reaches that scope's values and history and nothing
broader.
The host app's own code acts for itself through the library, and a Developer
reaches stored values at a terminal only through the app's own database
connection; a terminal given the app's API address and a token is a client of
the HTTP API like any other, asked about by the access policy on every request. Everyone else is refused, by default as if nothing were there.

## Rationale

tunables keeps no users or roles: the host app already knows who its people
are, and a second, separate list of administrators would drift from it. Asking
on every request means a person whose access the host app removes loses it at
once.
