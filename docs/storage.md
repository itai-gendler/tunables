---
title: Storage
description: Postgres through your own client, the four tables and how to create them, joining your transactions, and the storage contract behind it.
group: Integrate
order: 10
---

# Storage

tunables stores its values in your own Postgres, through the client your app
already has. It never opens a connection of its own: you hand it a client, and
it runs its statements through it, inside your transactions when you ask.

## Postgres

```ts
import pg from 'pg'
import { createTunables } from 'tunables'
import { fromPg, postgresStore } from 'tunables/postgres'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

export const tunables = createTunables({
  store: postgresStore(fromPg(pool), { schema: 'tunables' }),
  groups
})
```

`postgresStore(client, options)` takes:

| Option | What it is |
| --- | --- |
| `schema` | The schema its tables live in. Defaults to `tunables`. A plain lowercase name. |
| `lockKey` | The advisory lock key. Defaults to one derived from the schema name, so two apps in one database never share a lock. |

## Drivers

| Your client | Pass |
| --- | --- |
| node-postgres: a `Pool`, a `Client` or a pool client | `fromPg(pool)` |
| postgres.js: an `sql` instance | `fromPostgresJs(sql)` |
| Drizzle over either | the driver Drizzle was built on, through the same function |
| anything else | an object with `query(text, params)` that resolves rows, and `transaction(work)` |

```ts
import postgres from 'postgres'
import { fromPostgresJs, postgresStore } from 'tunables/postgres'

const sql = postgres(process.env.DATABASE_URL!)
const store = postgresStore(fromPostgresJs(sql))
```

Both drivers open their first connection on their first query, so creating
tunables at start never touches the database.

## Creating the tables

tunables keeps four tables in its schema. Create them one of three ways, in
your migrate or deploy step, never at boot:

- **`migrate`** creates the schema and tables if they are missing. It is safe
  to run on every deploy.

  ```ts
  import { fromPg, migrate } from 'tunables/postgres'

  await migrate(fromPg(pool), { schema: 'tunables' })
  ```

  Calling it from `connect` in `tunables.config.ts` lets `tunables sync`
  create and seed in one command; see the [quickstart](./quickstart.md).

- **Your own SQL migrations.** `tunablesSql({ schema })` returns the DDL as a
  string, to paste into a migration file.

- **Drizzle**, below.

Use the same `schema` everywhere: in the store, in `migrate` and in your
migrations.

### Drizzle

An app that generates its migrations with drizzle-kit can include tunables'
tables in its own schema file, so its migrations create them:

```ts [db/schema.ts]
import { tunablesTables } from 'tunables/drizzle'

const tunables = tunablesTables('tunables')
export const tunablesSchema = tunables.schema
export const tunablesGroups = tunables.groups
export const tunablesRevisions = tunables.revisions
export const tunablesRecords = tunables.records
export const tunablesAssignments = tunables.assignments
```

The Drizzle tables match `tunablesSql` column for column. They are for
migrations only: read settings with `tunables.get`, never with a query.

### The tables

| Table | Holds |
| --- | --- |
| `tunables_groups` | One row per group: its values as JSON, and who changed it last and when. |
| `tunables_revisions` | Every revision, appended and never updated, indexed by target. |
| `tunables_records` | Presets and catalog entries, as JSON by collection and id. |
| `tunables_assignments` | Which preset each subject is assigned, by preset set and slot. |

Only tunables writes these tables. A value moves in through a save, so the
move is recorded; never insert or update rows by hand.

## Transactions

Every change tunables makes runs in one transaction that also holds the
tunables lock (`pg_advisory_xact_lock` on the store's key), so changes never
interleave and a refused change writes nothing.

`within(host)` gives the same API inside a transaction your app already has
open. Its reads see your uncommitted writes, and its changes commit or roll
back with yours.

```ts
const client = await pool.connect()
try {
  await client.query('begin')
  const scoped = tunables.within(client)
  await scoped.save('readers', { briefsPerReader: 9 }, { actor, reason: 'Plan upgrade' })
  await client.query('insert into audit_log (message) values ($1)', ['Raised the reader limit'])
  await client.query('commit')
} catch (error) {
  await client.query('rollback')
  throw error
} finally {
  client.release()
}
```

`within` accepts a node-postgres client inside `begin`, a postgres.js
transaction from `sql.begin`, or any object with `query(text, params)`. A
Drizzle transaction object is not one; use the driver's transaction beneath
it.

### hold

A write in your app that depends on a setting, such as saving a Feed that must
stay under *Most articles per retrieval*, should hold the settings while it
reads them and writes:

```ts
await sql.begin(async (tx) => {
  const scoped = tunables.within(tx)
  await scoped.hold()
  const { maxArticlesPerRetrieval } = await scoped.get('collection')
  if (input.maxArticles > maxArticlesPerRetrieval) throw new Error('Too many articles for one retrieval.')
  await tx`update feeds set max_articles = ${input.maxArticles} where id = ${input.id}`
})
```

`hold` takes the tunables lock in shared mode until your transaction ends.
Writes that hold it run side by side; a change to tunables takes it
exclusively, so a lowering waits for your write to commit, and its
[guard](./checks-and-guards.md#guards-for-what-your-app-keeps) then sees what
you wrote. `hold` only means something inside a transaction, so it is offered
only on `within`.

## Two apps in one database

Give each app its own schema. The lock key is derived from the schema name,
so they never wait on each other.

## The storage contract

Postgres is one implementation of a small contract, `TunablesStore`. Anything
that can keep four kinds of thing, in a transaction, behind a lock, can store
tunables:

- a group's values, one row per group;
- revisions, appended and never changed, with increasing ids;
- records, the presets and catalog entries, as JSON by collection and id;
- assignments of presets to subjects.

```ts
interface StoreSession {
  lock(mode: 'shared' | 'exclusive'): Promise<void>
  readGroups(ids?: readonly string[]): Promise<StoredGroup[]>
  writeGroup(group: StoredGroup): Promise<void>
  appendRevision(revision: NewRevision): Promise<Revision>
  listRevisions(target: RevisionTarget, query: RevisionQuery): Promise<Revision[]>
  getRevision(id: string): Promise<Revision | undefined>
  listRecords(collection: string): Promise<StoredRecord[]>
  putRecord(record: Omit<StoredRecord, 'createdAt' | 'updatedAt'>): Promise<void>
  deleteRecord(collection: string, id: string): Promise<void>
  listAssignments(collection: string, filter?: { subject?: string, recordId?: string }): Promise<Assignment[]>
  putAssignment(assignment: Assignment): Promise<void>
  deleteAssignment(collection: string, subject: string, slot: string): Promise<void>
}

interface TunablesStore extends StoreSession {
  transaction<T>(work: (session: StoreSession) => Promise<T>): Promise<T>
  within?(host: unknown): StoreSession
}
```

`listRevisions` returns newest first, at most `limit`, and only ids below
`before` when it is given. A store without `within` cannot join a host
transaction, and `tunables.within` says so.

### The memory store

`memoryStore()` keeps everything in the process. Its transactions are
serialized and roll back on error, so it behaves as a database would for one
process. Use it for tests, demos and trying tunables out; it forgets
everything when the process exits.

```ts
import { createTunables, memoryStore } from 'tunables'

const tunables = createTunables({ store: memoryStore(), groups })
await tunables.sync()
```

It takes an optional `now()` for fixed timestamps, and has a `reset()` that
empties it. For tests, [`tunables/testing`](./testing.md) wraps it.
