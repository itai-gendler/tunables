# HTTP contract

The operations every client uses, whichever adapter serves them. The fetch
handler (`tunables/server`), Express (`tunables/express`) and oRPC
(`tunables/orpc`) only translate requests into `createService`'s operations;
change this contract before changing them.

## Access

- Every request asks the host who is acting (`actor`) and whether they may do
  this (`authorize`, with `read` or `change` and the target). tunables has no
  users or roles of its own. Without `authorize`, nothing is allowed.
- A refusal answers **404 Not found** by default, so an outsider cannot tell
  administration exists, or 401/403 when the host chooses `refusal: 'forbidden'`.
- An unknown group, preset set or catalog answers 404 naming it.

## Answers

- A refused change is **not** an error: it answers 200 with
  `{ saved: false, problems: [{ key?, message }] }`. A change that needs
  confirming answers `{ saved: false, confirm: "…" }` and is sent again with
  `confirmed: true`. A saved change answers `{ saved: true, revision, value }`.
- A body that is not JSON, or not the operation's shape, answers 400.
- Anything unexpected answers 500 without internal detail.
- Every answer is `application/json` and `no-store`.

## Routes (fetch handler, under its base path, default `/api/tunables`)

| Method | Path | Operation |
|---|---|---|
| GET | `describe` | definitions as the screens read them |
| GET | `groups` | every group's entry (All settings) |
| GET | `groups/:id` | one group's entry |
| PUT | `groups/:id` | save `{ values, reason?, confirmed? }` |
| POST | `groups/:id/reset` | reset `{ keys?, reason? }` |
| GET | `history?kind&name&id&limit&before` | revisions, newest first |
| POST | `restore` | restore `{ revision, reason?, confirmed? }` |
| GET | `presets/:set` | presets with how many are assigned each |
| POST | `presets/:set` | create `{ key, slot, label, values?, reason? }` |
| PUT | `presets/:set/:key` | update `{ label?, values?, reason? }` |
| DELETE | `presets/:set/:key` | remove `{ reason? }` |
| POST | `presets/:set/:key/default` | make default |
| GET | `presets/:set/assignments?subject` | assignments |
| PUT | `presets/:set/assignments/:subject/:slot` | assign `{ key \| null, reason? }` |
| GET | `catalogs/:id` | entries with what uses each |
| POST | `catalogs/:id` | add `{ id, values, reason? }` |
| PUT | `catalogs/:id/:entry` | edit `{ values, reason? }` |
| POST | `catalogs/:id/:entry/retire` | retire |
| POST | `catalogs/:id/:entry/reinstate` | reinstate |

Path segments are URL-encoded; a catalog entry id may contain `/`. Paths
outside the base path are not answered, so the host's routes go on.

oRPC exposes the same operations as procedures with the same names
(`describe`, `overview`, `group`, `save`, …) and inputs that carry the path
parameters as fields.
