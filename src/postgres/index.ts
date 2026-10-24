import type {
  Assignment,
  NewRevision,
  Revision,
  RevisionQuery,
  RevisionTarget,
  StoreSession,
  StoredGroup,
  StoredRecord,
  TunablesStore
} from '../engine/store.js'

/**
 * Postgres storage, in the app's own database. tunables never opens a
 * connection: the app hands it the client it already has, and tunables runs
 * its statements through it, inside the app's transactions when asked to.
 *
 * spec/storage.md describes the tables and the lock.
 */

/** Runs one statement and returns its rows. */
export interface SqlExecutor {
  query<T = Record<string, unknown>>(text: string, params?: readonly unknown[]): Promise<T[]>
}

/** A connection or pool that can also open a transaction. */
export interface SqlClient extends SqlExecutor {
  transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T>
}

/* ----------------------------------------------------------------- drivers */

interface PgQueryable {
  query(text: string, params?: unknown[]): Promise<{ rows: unknown[] }>
}
interface PgPoolLike extends PgQueryable {
  connect(): Promise<PgQueryable & { release(error?: Error | boolean): void }>
}

/** A node-postgres (`pg`) Pool, Client or PoolClient. */
export function fromPg(client: PgQueryable | PgPoolLike): SqlClient {
  const executor = (target: PgQueryable): SqlExecutor => ({
    async query<T>(text: string, params: readonly unknown[] = []) {
      return (await target.query(text, [...params])).rows as T[]
    }
  })
  return {
    ...executor(client),
    async transaction(work) {
      const pool = client as Partial<PgPoolLike>
      const connection = typeof pool.connect === 'function' && !('release' in client) ? await pool.connect() : undefined
      const target = connection ?? client
      await target.query('begin')
      try {
        const result = await work(executor(target))
        await target.query('commit')
        return result
      } catch (error) {
        await target.query('rollback').catch(() => undefined)
        throw error
      } finally {
        connection?.release()
      }
    }
  }
}

interface PostgresJsLike {
  unsafe(text: string, params?: unknown[]): PromiseLike<unknown[]>
  begin?<T>(work: (tx: PostgresJsLike) => Promise<T>): Promise<T>
}

/** A postgres.js `sql` instance, or a transaction `sql.begin` handed you. */
export function fromPostgresJs(sql: PostgresJsLike): SqlClient {
  const executor = (target: PostgresJsLike): SqlExecutor => ({
    async query<T>(text: string, params: readonly unknown[] = []) {
      return [...await target.unsafe(text, [...params])] as T[]
    }
  })
  return {
    ...executor(sql),
    async transaction(work) {
      if (!sql.begin) return work(executor(sql))
      return sql.begin(tx => work(executor(tx)))
    }
  }
}

/** Accepts a `SqlExecutor`, a node-postgres client or a postgres.js `sql`/transaction. */
export function asExecutor(host: unknown): SqlExecutor {
  const candidate = host as Partial<SqlExecutor & PostgresJsLike & PgQueryable>
  if (candidate && typeof candidate.unsafe === 'function') return fromPostgresJs(candidate as PostgresJsLike)
  if (candidate && typeof candidate.query === 'function') {
    const probe = host as { query: (...args: unknown[]) => unknown }
    // A tunables executor resolves rows; a node-postgres client resolves a result with `rows`.
    return {
      async query<T>(text: string, params: readonly unknown[] = []) {
        const result = await probe.query(text, [...params]) as unknown
        return (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as T[]
      }
    }
  }
  throw new TypeError('tunables/postgres: pass a node-postgres client, a postgres.js sql or transaction, or a SqlExecutor.')
}

/* ------------------------------------------------------------------ schema */

export interface PostgresStoreOptions {
  /** The schema the tables live in. Defaults to "tunables". */
  schema?: string
  /** The advisory lock key. Defaults to one derived from the schema name. */
  lockKey?: number
}

const IDENTIFIER = /^[a-z_][a-z0-9_]*$/

function quoted(schema: string): string {
  if (!IDENTIFIER.test(schema)) throw new TypeError(`tunables/postgres: "${schema}" is not a plain lowercase schema name.`)
  return `"${schema}"`
}

/** A stable 31-bit key from the schema name, so two apps in one database do not share a lock. */
export function lockKeyFor(schema: string): number {
  let hash = 0x811c9dc5
  for (const char of `tunables:${schema}`) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0) & 0x7fffffff
}

/** The tables tunables keeps, for the app's own migrations. `migrate` runs it. */
export function tunablesSql(options: { schema?: string } = {}): string {
  const s = quoted(options.schema ?? 'tunables')
  return `create schema if not exists ${s};

create table if not exists ${s}.tunables_groups (
  id text not null,
  scope text not null default '',
  "values" jsonb not null,
  updated_at timestamptz,
  updated_by text,
  primary key (id, scope)
);

create table if not exists ${s}.tunables_revisions (
  id bigserial primary key,
  target_kind text not null,
  target_name text not null,
  target_id text not null default '',
  actor text,
  reason text,
  changes jsonb not null,
  snapshot jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tunables_revisions_target_idx
  on ${s}.tunables_revisions (target_kind, target_name, target_id, id desc);

create table if not exists ${s}.tunables_records (
  collection text not null,
  id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

create table if not exists ${s}.tunables_assignments (
  collection text not null,
  subject text not null,
  slot text not null,
  record_id text not null,
  primary key (collection, subject, slot)
);

create index if not exists tunables_assignments_record_idx
  on ${s}.tunables_assignments (collection, record_id);
`
}

/**
 * Create tunables' tables if they are not there, and bring tables an earlier
 * version created up to date. Safe to run on every deploy.
 */
export async function migrate(client: SqlExecutor, options: { schema?: string } = {}): Promise<void> {
  const schema = options.schema ?? 'tunables'
  for (const statement of tunablesSql(options).split(/;\s*\n/).map(part => part.trim()).filter(Boolean)) {
    await client.query(statement)
  }
  // 0.1.0 kept one row per group, keyed by id alone; scopes key it by (id, scope).
  const s = quoted(schema)
  await client.query(`alter table ${s}.tunables_groups add column if not exists scope text not null default ''`)
  const keyed = await client.query<{ column_name: string }>(
    `select kcu.column_name from information_schema.table_constraints tc
     join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
     where tc.table_schema = $1 and tc.table_name = 'tunables_groups' and tc.constraint_type = 'PRIMARY KEY'`,
    [schema]
  )
  if (keyed.length === 1) {
    await client.query(`alter table ${s}.tunables_groups drop constraint tunables_groups_pkey`)
    await client.query(`alter table ${s}.tunables_groups add primary key (id, scope)`)
  }
}

/* ------------------------------------------------------------------- store */

const iso = (value: unknown): string | null => {
  if (value === null || value === undefined) return null
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString()
}
const json = (value: unknown) => JSON.stringify(value ?? null)

interface GroupRow {
  id: string
  scope: string
  values: Record<string, unknown>
  updated_at: unknown
  updated_by: string | null
}

const toGroup = (row: GroupRow): StoredGroup => ({ id: row.id, scope: row.scope, values: row.values, updatedAt: iso(row.updated_at), updatedBy: row.updated_by })

interface RevisionRow {
  id: string
  target_kind: RevisionTarget['kind']
  target_name: string
  target_id: string
  actor: string | null
  reason: string | null
  changes: Revision['changes']
  snapshot: unknown
  created_at: unknown
}

const toRevision = (row: RevisionRow): Revision => ({
  id: String(row.id),
  target: row.target_id ? { kind: row.target_kind, name: row.target_name, id: row.target_id } : { kind: row.target_kind, name: row.target_name },
  actor: row.actor,
  reason: row.reason,
  changes: row.changes,
  snapshot: row.snapshot,
  at: iso(row.created_at)!
})

function session(db: SqlExecutor, schema: string, lockKey: number): StoreSession {
  const s = quoted(schema)
  return {
    async lock(mode) {
      await db.query(mode === 'shared' ? 'select pg_advisory_xact_lock_shared($1::bigint)' : 'select pg_advisory_xact_lock($1::bigint)', [lockKey])
    },
    async readGroups(ids, scope = '') {
      const rows = ids
        ? await db.query<GroupRow>(`select id, scope, "values", updated_at, updated_by from ${s}.tunables_groups where scope = $1 and id = any($2::text[]) order by id`, [scope, [...ids]])
        : await db.query<GroupRow>(`select id, scope, "values", updated_at, updated_by from ${s}.tunables_groups where scope = $1 order by id`, [scope])
      return rows.map(toGroup)
    },
    async readScopes(id) {
      const rows = await db.query<GroupRow>(`select id, scope, "values", updated_at, updated_by from ${s}.tunables_groups where id = $1 and scope <> '' order by scope`, [id])
      return rows.map(toGroup)
    },
    async writeGroup(group) {
      await db.query(
        `insert into ${s}.tunables_groups (id, scope, "values", updated_at, updated_by) values ($1, $2, $3::text::jsonb, $4::timestamptz, $5)
         on conflict (id, scope) do update set "values" = excluded."values", updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
        [group.id, group.scope, json(group.values), group.updatedAt, group.updatedBy]
      )
    },
    async deleteGroup(id, scope) {
      await db.query(`delete from ${s}.tunables_groups where id = $1 and scope = $2`, [id, scope])
    },
    async appendRevision(revision: NewRevision) {
      const [row] = await db.query<RevisionRow>(
        `insert into ${s}.tunables_revisions (target_kind, target_name, target_id, actor, reason, changes, snapshot)
         values ($1, $2, $3, $4, $5, $6::text::jsonb, $7::text::jsonb)
         returning id::text as id, target_kind, target_name, target_id, actor, reason, changes, snapshot, created_at`,
        [revision.target.kind, revision.target.name, revision.target.id ?? '', revision.actor, revision.reason, json(revision.changes), json(revision.snapshot)]
      )
      return toRevision(row!)
    },
    async listRevisions(target: RevisionTarget, query: RevisionQuery) {
      const rows = await db.query<RevisionRow>(
        `select id::text as id, target_kind, target_name, target_id, actor, reason, changes, snapshot, created_at
         from ${s}.tunables_revisions
         where target_kind = $1 and target_name = $2 and target_id = $3 and ($4::bigint is null or id < $4::bigint)
         order by id desc limit $5`,
        [target.kind, target.name, target.id ?? '', query.before ?? null, query.limit]
      )
      return rows.map(toRevision)
    },
    async getRevision(id) {
      if (!/^\d+$/.test(id)) return undefined
      const [row] = await db.query<RevisionRow>(
        `select id::text as id, target_kind, target_name, target_id, actor, reason, changes, snapshot, created_at from ${s}.tunables_revisions where id = $1::bigint`,
        [id]
      )
      return row ? toRevision(row) : undefined
    },
    async listRecords(collection) {
      const rows = await db.query<{ collection: string, id: string, data: Record<string, unknown>, created_at: unknown, updated_at: unknown }>(
        `select collection, id, data, created_at, updated_at from ${s}.tunables_records where collection = $1 order by id`,
        [collection]
      )
      return rows.map((row): StoredRecord => ({ collection: row.collection, id: row.id, data: row.data, createdAt: iso(row.created_at), updatedAt: iso(row.updated_at) }))
    },
    async putRecord(record) {
      await db.query(
        `insert into ${s}.tunables_records (collection, id, data) values ($1, $2, $3::text::jsonb)
         on conflict (collection, id) do update set data = excluded.data, updated_at = now()`,
        [record.collection, record.id, json(record.data)]
      )
    },
    async deleteRecord(collection, id) {
      await db.query(`delete from ${s}.tunables_records where collection = $1 and id = $2`, [collection, id])
    },
    async listAssignments(collection, filter = {}) {
      const rows = await db.query<{ collection: string, subject: string, slot: string, record_id: string }>(
        `select collection, subject, slot, record_id from ${s}.tunables_assignments
         where collection = $1 and ($2::text is null or subject = $2) and ($3::text is null or record_id = $3)
         order by subject, slot`,
        [collection, filter.subject ?? null, filter.recordId ?? null]
      )
      return rows.map((row): Assignment => ({ collection: row.collection, subject: row.subject, slot: row.slot, recordId: row.record_id }))
    },
    async putAssignment(assignment) {
      await db.query(
        `insert into ${s}.tunables_assignments (collection, subject, slot, record_id) values ($1, $2, $3, $4)
         on conflict (collection, subject, slot) do update set record_id = excluded.record_id`,
        [assignment.collection, assignment.subject, assignment.slot, assignment.recordId]
      )
    },
    async deleteAssignment(collection, subject, slot) {
      await db.query(`delete from ${s}.tunables_assignments where collection = $1 and subject = $2 and slot = $3`, [collection, subject, slot])
    }
  }
}

/**
 * Store tunables in Postgres through the app's own client. Outside a
 * transaction, each statement runs on its own; `transaction` and `within` hold
 * the lock and commit together.
 */
export function postgresStore(client: SqlClient, options: PostgresStoreOptions = {}): TunablesStore {
  const schema = options.schema ?? 'tunables'
  quoted(schema)
  const lockKey = options.lockKey ?? lockKeyFor(schema)
  return {
    ...session(client, schema, lockKey),
    transaction: work => client.transaction(tx => work(session(tx, schema, lockKey))),
    within: host => session(asExecutor(host), schema, lockKey)
  }
}
