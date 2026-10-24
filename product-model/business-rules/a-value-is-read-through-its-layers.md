---
appliesTo:
  - { type: capability, id: read-settings }
  - { type: capability, id: override-settings }
  - { type: capability, id: use-inherited-values }
  - { type: entity, id: override, facts: [Values, Inherited values] }
  - { type: entity, id: settings-group, facts: [Plan] }
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

# A value is read through its layers, the most specific winning

At a scope, each setting of a group reads from its layers, broadest first: the
system's value, then the plan the scope is on where a preset set is the group's
plan at a scope the path names — the preset the scope is assigned, or its
slot's default — then the override of each scope on the path, in the chain's
order. The most specific layer that holds the setting wins. A read with no
scope reads the system's values. Layers exist only among stored values, never
between the environment and the database, and every place that shows a scoped
value says which layer it comes from.

## Rationale

A value whose source is not shown is the precedence mystery layered
configuration is known for; naming the layer keeps a scope's value as
explainable as the system's.
