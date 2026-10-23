---
appliesTo:
  - { type: capability, id: check-definitions }
  - { type: capability, id: explain-settings }
  - { type: capability, id: draft-missing-facts }
  - { type: capability, id: adopt-tunables }
  - { type: capability, id: define-setting }
  - { type: capability, id: verify-tunables }
references:
  - kind: code
    role: implementation
    target: src/pdd/index.ts
---

# tunables never writes the Product Model

tunables reads the app's Product Model to explain settings and check their
defaults, and drafts the facts it lacks, but never writes it. A fact is decided
and written by the model's own ideation, with the Developer's approval.

## Rationale

The Product Model is the statement of what the product means; a tool that
wrote to it whenever code disagreed would turn the code into the source of
truth the model exists to check.
