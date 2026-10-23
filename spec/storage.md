# Storage contract

tunables keeps four things. Any store that can hold them, in a transaction,
behind one lock, can store tunables. This contract governs
`src/engine/store.ts`, the in-memory store and `tunables/postgres`; change it
here before changing them.

## What is kept

| Thing | Shape | Written by |
|---|---|---|
| Group values | one row per group: `id`, `values` (JSON object by field key), `updated_at`, `updated_by` | saves, resets, restores, `sync` |
| Revisions | append-only: increasing `id`, `target` (`kind` group/preset/catalog/assignment, `name`, optional `id`), `actor`, `reason`, `changes` (`[{ key, from, to }]`), `snapshot` (the whole target after the change, `null` when removed), `at` | every change |
| Records | JSON `data` by `collection` and `id`: presets in `preset:<set>`, catalog entries in `catalog:<catalog>` | preset and catalog changes, `sync` |
| Assignments | `collection`, `subject`, `slot` → `record_id` | assigning presets |

- **Values are stored plain.** Whether a value differs from its default, and
  how it reads, is worked out when it is read. Defaults are not stored: the
  definition is their one home.
- **Stored fields no definition declares are kept.** `sync` reports them and
  leaves them; nothing is dropped silently.
- **Revisions are never changed or deleted.** A revision's `snapshot` is what
  makes restore an ordinary save.

## Transactions and the lock

- Every change runs in one transaction and first takes the tunables lock
  **exclusively**. Reads, checks, the write and the revision commit together or
  not at all.
- A host write that depends on tunables (a Feed configured within a bound)
  joins the host's own transaction with `tunables.within(host)` and takes the
  lock **shared** with `hold()`. A lowering then waits for it, and sees it.
- `within(host)` never opens or commits a transaction: the host does.

## Postgres

- Tables `tunables_groups`, `tunables_revisions`, `tunables_records`,
  `tunables_assignments` in a schema the app names (default `tunables`).
  `tunablesSql` and the Drizzle tables in `tunables/drizzle` are the same
  columns; a test holds them equal.
- The lock is a transaction-scoped advisory lock whose key comes from the
  schema name, so two apps in one database never share it.
- JSON parameters are sent as text and cast to `jsonb`, which every driver
  passes through unchanged.
- tunables never opens a connection. The app hands it its node-postgres or
  postgres.js client, or any `SqlExecutor`.

## Another database

An adapter implements `TunablesStore`: the session methods, `transaction`, and
`within` when the database can join a host transaction. It runs the engine
suite in `test/suites/engine.ts` unchanged; passing it is what "implements the
contract" means.
