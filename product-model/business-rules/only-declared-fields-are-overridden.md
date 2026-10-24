---
appliesTo:
  - { type: entity, id: setting, facts: [Override scopes] }
  - { type: capability, id: override-settings }
references:
  - kind: spec
    role: intent
    target: spec/scopes.md
  - kind: code
    role: implementation
    target: src/engine/tunables.ts
---

# Only settings declared overridable at a scope are set there

A setting is overridden only at the scopes its declaration names; without that
declaration it is set for the whole system alone. A save at a scope that
carries any other setting is refused naming the setting and the scope, and the
screens at a scope list only the settings it may override.
