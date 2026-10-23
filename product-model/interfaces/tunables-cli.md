---
type: cli
actors: [developer, ai-agent]
entryPoints:
  - cli: tunables
references:
  - kind: code
    role: implementation
    target: src/cli.ts
---

# tunables command

The terminal Interface, run in the host app's repository against its tunables
config. Without a database it checks the definitions, writes `.env.example`,
generates the explanations and drafts the facts the Product Model lacks; through
the app's own database it syncs, prints, changes and restores stored values and
shows their history. It also installs and updates the agent skills. An AI agent
reaches the same Interface when a skill runs a check.
