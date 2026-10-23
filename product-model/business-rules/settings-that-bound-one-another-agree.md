---
appliesTo:
  - { type: entity, id: settings-group, facts: [Values, Rules] }
  - { type: entity, id: preset, facts: [Values] }
references:
  - kind: code
    role: implementation
    target: src/model/definitions.ts#GroupDefinition
---

# Settings that bound one another agree

Where one setting bounds another in the same group or preset — a total that is
never more than its parts allow, a shortest that is never above a longest — the
rule between them holds after every save. The whole group or preset is checked
on every change, whichever of its settings changed, and a change that breaks a
rule is refused naming it.
