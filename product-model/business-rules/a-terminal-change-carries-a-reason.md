---
appliesTo:
  - { type: capability, id: change-settings, contexts: [{ place: tunables-cli }] }
  - { type: capability, id: restore-revision, contexts: [{ place: tunables-cli }] }
references:
  - kind: code
    role: implementation
    target: src/commands/values.ts#runSet
---

# A terminal change carries a reason

A change or a restore made from a terminal always gives a reason, kept on its
revision; without one, nothing is attempted.

## Rationale

A terminal change bypasses the screens, often in a hurry, and the reason is the
only account of why the app changed that whoever reads the history later will
have.
