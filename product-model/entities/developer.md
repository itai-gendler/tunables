---
kind: person
acts: external
references:
  - kind: code
    role: implementation
    target: src/config.ts#defineConfig
---

# Developer

A person who builds the host app. They declare its settings, preset sets,
catalogs and deployment values in code, run the terminal command to sync,
check, explain and change stored values, and ask their coding agent to adopt,
define and verify tunables in the app. At a terminal they reach the stored
values through the app's own database connection, so a change they make there
is recorded under their own name.
