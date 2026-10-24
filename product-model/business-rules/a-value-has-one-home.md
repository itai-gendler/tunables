---
appliesTo:
  - { type: entity, id: setting }
  - { type: entity, id: deployment-value }
references:
  - kind: code
    role: implementation
    target: src/model/environment.ts
---

# A value has one home

Every value the app is tuned by lives in exactly one place: a settings group,
which an Administrator changes while the app runs, or the environment, which
only a deployment sets. No value is kept in both, and none is also hard-coded
where the app uses it. A setting's overrides at a scope live beside it in the
same database, as layers of that one home, never in the environment.
