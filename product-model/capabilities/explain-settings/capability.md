---
domain: definition-checks
availability: [{ place: tunables-cli }]
references:
  - kind: code
    role: implementation
    target: src/commands/explain.ts#runExplain
  - kind: code
    role: implementation
    target: src/pdd/index.ts#readModelFacts
---

# Explain settings

Generates every setting's explanation from the app's Product Model: each
Entity's facts, with the description and the default each states, so a setting
explains itself where it is set in the model's own words and nobody retypes
them.
