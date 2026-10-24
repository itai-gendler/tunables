---
type: api
actors: [administrator, scope-owner]
entryPoints:
  - api: /api/tunables
references:
  - kind: code
    role: implementation
    target: src/server/index.ts#createHandler
  - kind: code
    role: implementation
    target: src/server/express.ts
  - kind: code
    role: implementation
    target: src/server/orpc.ts
  - kind: code
    role: implementation
    target: src/client/index.ts
---

# tunables HTTP API

The operations a host app mounts under a path of its choosing, by default
`/api/tunables`, through which the embedded screens and any other client read
and change settings, presets and catalogs, for the whole system or, given a
scope, for one workspace or one user. The host app says who is asking and
whether they may act on every request, for the scope it names; a refusal
answers, by default, as if nothing were there.
