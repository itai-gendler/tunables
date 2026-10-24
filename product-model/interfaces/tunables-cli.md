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
shows their history, for the whole system or at one scope, such as a workspace
or a user inside it, where it also returns settings to what the scope inherits.
Given the address of a running app's HTTP API and a token, it prints, changes
and restores values and shows their history through that API instead, with no
config and no database connection: the app's access policy decides what the
token may do, and the app names who made each change. Syncing always goes
through the database. It also installs and updates the agent skills. An AI
agent reaches the same Interface when a skill runs a check.
