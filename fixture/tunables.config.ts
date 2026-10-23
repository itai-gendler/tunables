import { defineConfig } from '../src/config.js'
import { createTunables, memoryStore } from '../src/index.js'
import { fromPostgresJs, migrate, postgresStore } from '../src/postgres/index.js'
import { catalogs, collectionNotes, effects, environment, feedsAbove, groups, presets, units } from './news.js'
import { explanations } from './explanations.js'

const feeds = [{ name: 'Ars Technica', maxArticles: 300, lookbackDays: 30, official: true }]
let close: (() => Promise<void>) | undefined

/** The fixture as an app's tunables.config.ts: news's definitions, its Product Model, and its database. */
export default defineConfig({
  groups,
  presets,
  catalogs,
  units,
  effects,
  environment,
  envExample: 'env.example',
  envHeader: 'news: deployment values. Settings an Administrator tunes live in the database.',
  productModel: 'product-model',
  explanations: 'explanations.ts',
  explanationsImport: '../src/index.js',
  async connect() {
    const url = process.env.TUNABLES_FIXTURE_DATABASE_URL
    let store = memoryStore()
    if (url) {
      const { default: postgres } = await import('postgres')
      const sql = postgres(url, { max: 2, onnotice: () => {} })
      close = () => sql.end()
      const client = fromPostgresJs(sql)
      await migrate(client, { schema: 'fixture' })
      store = postgresStore(client, { schema: 'fixture' }) as never
    }
    return createTunables({ store, groups, presets, catalogs, units, effects, explanations, guards: { collection: [feedsAbove(() => feeds)] }, notes: { collection: collectionNotes(() => feeds) } })
  },
  async disconnect() {
    await close?.()
  }
})
