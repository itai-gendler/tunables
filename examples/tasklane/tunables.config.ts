import { defineConfig } from '../../src/config.js'
import { createTunables, memoryStore } from '../../src/index.js'
import { fromPostgresJs, migrate, postgresStore } from '../../src/postgres/index.js'
import { catalogs, effects, groups, presets, scopeLabel, scopes } from './tunables.js'

let close: (() => Promise<void>) | undefined

/** Tasklane's tunables.config.ts: its definitions and its database, for the terminal. */
export default defineConfig({
  groups,
  presets,
  catalogs,
  effects,
  async connect() {
    const url = process.env.DATABASE_URL
    let store = memoryStore()
    if (url) {
      const { default: postgres } = await import('postgres')
      const sql = postgres(url, { max: 2, onnotice: () => {} })
      close = () => sql.end()
      const client = fromPostgresJs(sql)
      await migrate(client, { schema: 'tasklane' })
      store = postgresStore(client, { schema: 'tasklane' }) as never
    }
    return createTunables({ store, groups, presets, catalogs, effects, scopes, scopeLabel })
  },
  async disconnect() {
    await close?.()
  }
})
