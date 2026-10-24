---
appliesTo:
  - { type: entity, id: override, effect: creates }
  - { type: entity, id: override, effect: changes }
  - { type: entity, id: override, effect: removes }
  - type: entity
    id: override
    effect: reads
    contexts: [{ place: embedded-screens }, { place: http-api }]
permits:
  - actors: [administrator, scope-owner]
    configuredBy: access-policy
  - actors: [host-app]
  - actors: [developer]
references:
  - kind: spec
    role: intent
    target: spec/scopes.md
  - kind: adr
    role: intent
    target: decisions/0009-settings-are-layered-by-scope.md
  - kind: code
    role: implementation
    target: src/server/service.ts
---

# The host app decides who reads and changes each scope

Through the screens and the HTTP API, a person reads or changes a scope's
values only when the host app's access policy, told the scope of the request,
says they may: an Administrator for any scope it allows them, a workspace owner
for their own workspace, a user for their own values inside it. The host app's
own code acts for any scope through the library, and a Developer reaches any
scope at a terminal only through the app's own database connection; through
the app's API, a terminal reaches only the scopes the access policy allows its
token. Everyone
else is refused, by default as if nothing were there.

## Rationale

Who owns a workspace, or is a user in it, is the host app's knowledge; asking
it on every request, with the scope, lets people who are not administrators
tune their own part of the app without tunables keeping a second list of who
may.
