---
domain: administration
references:
  - kind: spec
    role: intent
    target: spec/scopes.md
  - kind: adr
    role: intent
    target: decisions/0009-settings-are-layered-by-scope.md
  - kind: code
    role: implementation
    target: src/engine/store.ts
---

# Override

The values one scope sets for a settings group in place of what it inherits,
such as workspace Acme keeping 200 tasks per list, or Dana in Acme getting her
digest at 07:00. It holds only the settings overridden at that scope; every
other setting reads what the scope inherits. A scope that overrides nothing in a
group keeps no override for it.

## Information kept

- **Group** — the settings group it overrides
- **Scope** — the place in the host app's chain of scopes it is for, such as workspace Acme, or user Dana inside workspace Acme; named by its key unless the host app gives it a label
- **Values** — its value for each setting overridden at this scope, and only those
- **Inherited values** — for each setting this scope may override, the value it reads without this scope's own, and where that comes from: the system, a plan, or a broader scope
- **Changed at** — when its values last changed
- **Changed by** — who last changed them
