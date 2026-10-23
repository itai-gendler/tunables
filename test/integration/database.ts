import pg from 'pg'
import postgres from 'postgres'
import { fromPg, fromPostgresJs, migrate, postgresStore, type SqlClient } from '../../src/postgres/index.js'

export const DATABASE_URL = process.env.TUNABLES_TEST_DATABASE_URL ?? 'postgres://tunables:tunables@localhost:5434/tunables'

export const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 6 })
export const sql = postgres(DATABASE_URL, { max: 6, onnotice: () => {} })

export const drivers: Record<string, SqlClient> = {
  'node-postgres': fromPg(pool),
  'postgres.js': fromPostgresJs(sql)
}

/** An empty schema with tunables' tables, for one test. */
export async function freshSchema(client: SqlClient, schema = 'tunables_test') {
  await client.query(`drop schema if exists "${schema}" cascade`)
  await migrate(client, { schema })
  return postgresStore(client, { schema })
}

export async function closeAll() {
  await pool.end()
  await sql.end()
}
