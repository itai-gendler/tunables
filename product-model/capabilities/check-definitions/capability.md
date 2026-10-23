---
domain: definition-checks
availability: [{ place: tunables-cli }]
references:
  - kind: code
    role: implementation
    target: src/commands/check.ts#runCheck
  - kind: code
    role: implementation
    target: src/pdd/index.ts#checkAgainstModel
---

# Check definitions

Checks, without a database, everything that must hold before the app runs: the
definitions are sound, `.env.example` lists every deployment value as declared,
the generated explanations match the Product Model, and every setting's fact
exists in the model with the default the model states.

## Intent

The definitions, the environment file and the Product Model tell one story, and
a pipeline can prove it on every change without a database.
