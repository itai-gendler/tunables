---
colorSlot: 5
references:
  - kind: code
    role: implementation
    target: src/pdd/index.ts
---

# Definition checks

Keeping the definitions and the app's Product Model one story, without a
database: checking that the definitions are sound and agree with the model,
generating each setting's explanation from the model, and drafting the facts
the model lacks.

## Boundary

Owns reading the Product Model's facts and comparing the definitions with them.
It never writes the Product Model, which only the model's own ideation does,
and it neither reads nor changes stored values.
