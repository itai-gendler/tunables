---
appliesTo:
  - { type: entity, id: settings-group, facts: [Values, Rules] }
  - { type: entity, id: preset, facts: [Values] }
  - { type: entity, id: override, facts: [Values] }
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
rule is refused naming it. A change at a scope is checked on the group's values
as read at that scope after the change. A broader change — the system's values,
a plan, or a broader scope's own — is also checked on the values as each
narrower scope with its own values reads them, and a rule it would newly break
there is refused naming that scope. A rule already broken there before the
change is not blamed on it.
