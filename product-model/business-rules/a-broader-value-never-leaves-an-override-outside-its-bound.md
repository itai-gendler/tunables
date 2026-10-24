---
appliesTo:
  - { type: entity, id: settings-group, effect: changes, facts: [Values] }
  - { type: entity, id: preset, effect: changes, facts: [Values] }
  - { type: entity, id: assignment, effect: creates }
  - { type: entity, id: assignment, effect: changes }
  - { type: entity, id: assignment, effect: removes }
  - { type: entity, id: override, effect: changes, facts: [Values] }
  - { type: entity, id: override, effect: removes }
references:
  - kind: spec
    role: intent
    target: spec/scopes.md
  - kind: adr
    role: intent
    target: decisions/0009-settings-are-layered-by-scope.md
  - kind: code
    role: implementation
    target: src/engine/tunables.ts
---

# A broader value never leaves an override outside its bound

A change to what a scope inherits never leaves an override narrower than it
outside its bound: lowering the system's value, a plan's value or a broader
scope's override below an override bound at most what it inherits, raising one
above an override bound at least, returning a broader scope to what it
inherits, or moving a scope to another plan. Such a change is refused naming
each override it would break, by its scope's label where the host app gives
one, with the value it keeps and the bound.

## Rationale

The chain is a hierarchy, so a user's values sit inside their workspace and a
workspace's inside its plan and the system; checking in both directions is what
lets a bound on what a scope inherits stay true after the broader value moves.
