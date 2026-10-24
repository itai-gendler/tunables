---
appliesTo:
  - { type: entity, id: override, effect: creates, facts: [Values] }
  - { type: entity, id: override, effect: changes, facts: [Values] }
  - { type: entity, id: setting, facts: [Override bound] }
references:
  - kind: spec
    role: intent
    target: spec/scopes.md
  - kind: code
    role: implementation
    target: src/engine/tunables.ts
---

# An override stays within its bound

A setting bound at most what it inherits at a scope is never overridden there
above the value the scope inherits, and one bound at least never below it; a
free override takes any value its kind allows. Only numbers are bound this way.
A value outside its bound is refused before anything is stored, naming the
bound and that it is what the scope inherits.
