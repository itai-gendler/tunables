---
type: api
actors: [developer, host-app]
entryPoints:
  - api: tunables
  - api: tunables/postgres
references:
  - kind: code
    role: implementation
    target: src/index.ts
  - kind: code
    role: implementation
    target: src/postgres/index.ts
---

# tunables library

The package the host app's code imports. A Developer declares settings, preset
sets, catalogs and deployment values with it; the host app creates its
tunables over its own database with it, and reads, holds, syncs and changes
settings through it, inside its own transactions when it asks to. The Postgres
storage runs its statements through the connection the host app already has
and never opens one of its own.
