---
domain: definition-checks
availability: [{ place: tunables-cli }]
references:
  - kind: code
    role: implementation
    target: src/commands/model.ts#runModelDraft
  - kind: code
    role: implementation
    target: src/pdd/index.ts#draftFacts
---

# Draft missing facts

Drafts, for every setting that names no fact the Product Model keeps, the fact
line the model would need, grouped by Entity, to bring to the Product Model's
own ideation, which decides and writes it.
