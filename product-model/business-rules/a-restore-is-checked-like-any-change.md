---
appliesTo:
  - { type: capability, id: restore-revision }
  - { type: entity, id: revision, facts: [Snapshot] }
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#createTunables
---

# A restore is checked like any change

Restoring a revision is a change like any other: the values it puts back are
checked against each setting's kind, the rules between settings, the presets
the settings bound and the host app's own checks, and confirmed when they have
consequences. A scope's revision is checked as a change at that scope, against
what the scope inherits now. An earlier state gets no exemption from what the present one must
pass, and a restore is recorded as a new revision rather than by rewriting
history.
