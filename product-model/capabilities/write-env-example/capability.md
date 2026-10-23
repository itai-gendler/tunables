---
domain: definitions
availability: [{ place: tunables-cli }]
references:
  - kind: code
    role: implementation
    target: src/commands/env.ts#runEnv
  - kind: code
    role: implementation
    target: src/model/environment.ts#renderEnvExample
---

# Write .env.example

Writes `.env.example` from the deployment values: each under its section and
description, commented out at its default, and left empty where it must be set,
so a deployment sees every value it may set and what each is for.
