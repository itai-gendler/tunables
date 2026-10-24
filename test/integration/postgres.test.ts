import { afterAll, describe, expect, it } from 'vitest'
import { getTableConfig } from 'drizzle-orm/pg-core'
import { createTunables, memoryStore } from '../../src/index.js'
import { lockKeyFor, migrate, postgresStore, tunablesSql } from '../../src/postgres/index.js'
import { tunablesTables } from '../../src/postgres/drizzle.js'
import { catalogs, effects, feedsAbove, groups, presets, units } from '../fixtures/news/news.js'
import { failable } from '../support.js'
import { engineSuite } from '../suites/engine.js'
import { scopesSuite } from '../suites/scopes.js'
import { closeAll, drivers, freshSchema } from './database.js'

for (const [name, client] of Object.entries(drivers)) {
  engineSuite(`Postgres via ${name}`, async () => failable(await freshSchema(client)))
  scopesSuite(`Postgres via ${name}`, async () => failable(await freshSchema(client)))
}

afterAll(closeAll)

describe('Postgres storage', () => {
  it('migrates more than once without harm', async () => {
    const client = drivers['node-postgres']!
    await freshSchema(client)
    await migrate(client, { schema: 'tunables_test' })
    const tables = await client.query<{ table_name: string }>(`select table_name from information_schema.tables where table_schema = 'tunables_test' order by table_name`)
    expect(tables.map(row => row.table_name)).toEqual(['tunables_assignments', 'tunables_groups', 'tunables_records', 'tunables_revisions'])
  })

  it('refuses a schema name that is not a plain identifier', () => {
    expect(() => tunablesSql({ schema: 'x"; drop table y; --' })).toThrow(/plain lowercase schema name/)
    expect(lockKeyFor('news')).not.toBe(lockKeyFor('tunables'))
  })

  it('keeps the Drizzle tables and the SQL the same columns', async () => {
    const client = drivers['node-postgres']!
    await freshSchema(client)
    const columns = await client.query<{ table_name: string, column_name: string }>(
      `select table_name, column_name from information_schema.columns where table_schema = 'tunables_test' order by table_name, ordinal_position`
    )
    const tables = tunablesTables('tunables_test')
    const fromDrizzle = [tables.assignments, tables.groups, tables.records, tables.revisions]
      .flatMap(table => getTableConfig(table).columns.map(column => `${getTableConfig(table).name}.${column.name}`))
    expect(fromDrizzle.sort()).toEqual(columns.map(row => `${row.table_name}.${row.column_name}`).sort())
  })

  for (const [name, client] of Object.entries(drivers)) {
    it(`commits a host write and a tunables change together, or neither (${name})`, async () => {
      const store = await freshSchema(client)
      const tunables = createTunables({ store, groups, presets, catalogs, effects, units })
      await tunables.sync()
      await client.query('create table if not exists tunables_test.feeds (name text primary key, max_articles int not null)')
      await expect(client.transaction(async (tx) => {
        const scoped = tunables.within(tx)
        await scoped.hold()
        const limits = await scoped.get('collection')
        await tx.query('insert into tunables_test.feeds values ($1, $2)', ['Ars', limits.maxArticlesPerRetrieval])
        const saved = await scoped.save('readers', { briefsPerReader: 9 })
        expect(saved.saved).toBe(true)
        throw new Error('The host changed its mind.')
      })).rejects.toThrow(/changed its mind/)
      expect((await tunables.get('readers')).briefsPerReader).toBe(12)
      expect(await client.query('select * from tunables_test.feeds')).toEqual([])
    })
  }

  it('makes a lowering wait for a host write that holds the settings, then sees it', async () => {
    const client = drivers['node-postgres']!
    const store = await freshSchema(client)
    await client.query('create table tunables_test.feeds (name text primary key, max_articles int not null, lookback_days int not null)')
    const feedsOf = async () => {
      const rows = await client.query<{ name: string, max_articles: number, lookback_days: number }>('select * from tunables_test.feeds')
      return rows.map(row => ({ name: row.name, maxArticles: row.max_articles, lookbackDays: row.lookback_days, official: false }))
    }
    const tunables = createTunables({ store, groups, presets, catalogs, effects, units, guards: { collection: [feedsAbove(feedsOf)] } })
    await tunables.sync()

    let release!: () => void
    const held = new Promise<void>(resolve => { release = resolve })
    let holding!: () => void
    const isHolding = new Promise<void>(resolve => { holding = resolve })
    const hostWrite = client.transaction(async (tx) => {
      const scoped = tunables.within(tx)
      await scoped.hold()
      const limits = await scoped.get('collection')
      await tx.query('insert into tunables_test.feeds values ($1, $2, $3)', ['Ars', limits.maxArticlesPerRetrieval, 7])
      holding()
      await held
    })
    await isHolding
    const lowering = tunables.save('collection', { maxArticlesPerRetrieval: 30, newFeedMaxArticles: 20 })
    const early = await Promise.race([lowering.then(() => 'finished'), new Promise(resolve => setTimeout(() => resolve('waiting'), 300))])
    expect(early).toBe('waiting')
    release()
    await hostWrite
    const outcome = await lowering
    expect(outcome.saved).toBe(false)
    expect(outcome.problems[0]!.message).toBe('Feed "Ars" reads 500 articles, above the Most articles per retrieval of 30.')
  })

  it('keeps two apps in one database apart by schema', async () => {
    const client = drivers['postgres.js']!
    const first = await freshSchema(client, 'tunables_one')
    const second = await freshSchema(client, 'tunables_two')
    const one = createTunables({ store: first, groups, effects })
    const two = createTunables({ store: second, groups, effects })
    await one.sync()
    await two.sync()
    await one.save('readers', { briefsPerReader: 2 })
    expect((await two.get('readers')).briefsPerReader).toBe(12)
    await client.query('drop schema tunables_one cascade')
    await client.query('drop schema tunables_two cascade')
  })

  it('stores the same revisions as the memory store', async () => {
    const memory = createTunables({ store: memoryStore(), groups, effects })
    const store = postgresStore(drivers['node-postgres']!, { schema: 'tunables_test' })
    await freshSchema(drivers['node-postgres']!)
    const database = createTunables({ store, groups, effects })
    for (const tunables of [memory, database]) {
      await tunables.sync({ actor: 'sync' })
      await tunables.save('readers', { briefsPerReader: 3 }, { actor: 'Ada', reason: 'Fewer' })
    }
    const strip = (revisions: Awaited<ReturnType<typeof memory.history>>) => revisions.map(({ id: _id, at: _at, ...rest }) => rest)
    expect(strip(await database.history('readers'))).toEqual(strip(await memory.history('readers')))
  })
})
