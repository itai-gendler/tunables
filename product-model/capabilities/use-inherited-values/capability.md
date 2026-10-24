---
domain: administration
availability: [{ place: embedded-screens }, { place: http-api }, { place: tunables-cli }, { place: library }]
references:
  - kind: spec
    role: intent
    target: spec/scopes.md
  - kind: code
    role: implementation
    target: src/engine/tunables.ts
  - kind: code
    role: implementation
    target: src/commands/values.ts#runSet
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesGroupForm.vue
---

# Use inherited values

Stops a scope overriding settings, so each reads again what the scope inherits
from a broader scope, its plan or the system, through the same checks as any
change at that scope. Use inherited sits beside each value a scope overrides, and a
Developer names the settings to inherit at a terminal. A
scope left overriding nothing in a group keeps no override for it, and the
change is recorded as one revision on that scope.
