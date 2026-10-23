---
appliesTo:
  - { type: entity, id: setting, facts: [Default] }
  - { type: capability, id: reset-settings }
references:
  - kind: code
    role: implementation
    target: src/model/definitions.ts#defaultsOf
---

# A default lives only in its definition

A setting's default is declared once, beside its kind, and every use of it
reads it there: seeding, resetting, restoring a revision that lacks the
setting, the screens and the API. Nothing else in the app keeps a copy, and the
Product Model's statement of it is checked against the declaration rather than
copied into it.
