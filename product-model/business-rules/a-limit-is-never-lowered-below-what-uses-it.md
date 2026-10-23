---
appliesTo:
  - { type: entity, id: settings-group, effect: changes, facts: [Values] }
  - { type: capability, id: hold-settings }
references:
  - kind: code
    role: implementation
    target: src/engine/tunables.ts#Guard
---

# A limit is never lowered below what uses it

A setting is never changed to a value that something already using it exceeds:
a preset the settings bound, or a thing the host app keeps that its own checks
say depends on the group. The change is refused naming each of them. A host
write that depends on a limit holds the settings until it commits, so a limit
cannot be lowered between being read and being used.
