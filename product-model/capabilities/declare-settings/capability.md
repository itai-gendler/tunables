---
domain: definitions
availability: [{ place: library }]
references:
  - kind: code
    role: implementation
    target: src/model/definitions.ts
  - kind: code
    role: implementation
    target: src/model/kinds.ts
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
---

# Declare settings

Declares, in the host app's code, each setting once: its kind, its unit, its
default, the Product Model fact it is, the section it is listed under and what
changing it affects. Settings are declared in groups, with the rules by which a
group's settings bound one another and the changes that must be confirmed, and
the same way in preset sets, with their slots and how the settings bound them,
and in catalogs. Each setting also declares the scopes at which it may be
overridden and how — freely, or at most or at least what it inherits — and
nothing is overridable unless declared; a preset set may stand as the plan of a
group at one scope. The host app declares its chain of scopes, broadest first,
when it creates its tunables. Everything else about a setting — its check, how it reads, its
input and its schema in the API — follows from that one declaration.

## Intent

A value that can change at run time should be declared as carefully as a
constant, and only once, so nothing about it can drift between the code, the
database and the screens.
