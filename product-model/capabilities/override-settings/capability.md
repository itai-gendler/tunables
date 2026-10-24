---
domain: administration
availability: [{ place: embedded-screens }, { place: http-api }, { place: tunables-cli }, { place: library }]
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
  - kind: code
    role: implementation
    target: src/server/service.ts
  - kind: code
    role: implementation
    target: src/commands/values.ts#runSet
  - kind: code
    role: implementation
    target: layers/nuxt/tunables/app/components/TunablesGroupForm.vue
---

# Override settings

Saves values of a settings group for one scope, such as a workspace or a user
inside it, in place of what that scope inherits. Only the settings declared
overridable at that scope may be saved there. Each value is checked against its
kind and against its bound on the value it inherits, the group's rules run on
the values as read at that scope after the change, the host app's own checks are
given the scope, and a change with consequences is saved only once confirmed. A
change that would leave a narrower scope's override outside its bound is
refused naming it. A saved change is recorded as one revision on that scope.

## Intent

A workspace or a person can have values of their own without the app
re-implementing settings beside tunables, and every such value is as checked,
bounded and recorded as the system's.
