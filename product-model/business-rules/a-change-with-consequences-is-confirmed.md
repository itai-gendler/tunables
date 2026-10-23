---
appliesTo:
  - { type: capability, id: change-settings }
  - { type: capability, id: restore-revision }
  - { type: entity, id: settings-group, facts: [Confirmation] }
references:
  - kind: code
    role: implementation
    target: src/model/definitions.ts#GroupDefinition
---

# A change with consequences is confirmed

A change a settings group says has consequences — one that redoes work already
done, or costs money — is not saved until whoever makes it has been told what
it causes and confirms, from the screens, the API, a terminal or a restore
alike. A change the group does not ask about saves at once.
