import postgres from 'postgres'
import { createTunables, memoryStore, type TunablesStore } from 'tunables'
import { fromPostgresJs, migrate, postgresStore } from 'tunables/postgres'
import { catalogs, collectionNotes, effects, feedsAbove, groups, presets, units, type FixtureFeed } from '../../../fixture/news'
import { explanations } from '../../../fixture/explanations'

/** The Feeds the fixture's news keeps, which the collection bounds must stay above. */
export const fixtureFeeds: FixtureFeed[] = [
  { name: 'Ars Technica', maxArticles: 300, lookbackDays: 30, official: true },
  { name: 'The Verge', maxArticles: 200, lookbackDays: 14, official: true },
  { name: 'A personal blog', maxArticles: 50, lookbackDays: 90, official: false }
]

async function makeTunables() {
  let store: TunablesStore & { reset?: () => void }
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl) {
    const sql = postgres(databaseUrl, { max: 4, onnotice: () => {} })
    const client = fromPostgresJs(sql)
    await migrate(client, { schema: 'playground' })
    store = postgresStore(client, { schema: 'playground' })
  } else {
    store = memoryStore()
  }
  const tunables = createTunables({
  store,
  groups,
  presets,
  catalogs,
  effects,
  units,
  explanations,
  guards: { collection: [feedsAbove(() => fixtureFeeds)] },
  notes: { collection: collectionNotes(() => fixtureFeeds) }
  })
  await tunables.sync({ actor: 'playground' })
  return { tunables, store }
}

let made: ReturnType<typeof makeTunables> | undefined
/** The playground's tunables, set up and seeded on first use: boot never needs the database. */
export function usePlaygroundTunables() {
  made ??= makeTunables()
  return made
}

/** Empty the memory store and seed it again, for tests that need a known start. */
export async function resetPlayground() {
  const { tunables, store } = await usePlaygroundTunables()
  if (!store.reset) throw createError({ statusCode: 409, message: 'Only the memory store can be reset.' })
  store.reset()
  await tunables.sync({ actor: 'playground' })
}

/** Who the playground says is signed in, from its cookie: an Administrator or a reader. */
export interface PlaygroundContext {
  who: 'admin' | 'reader'
}

export const access = {
  actor: (context: PlaygroundContext) => context.who === 'admin' ? { id: 'ada', name: 'Ada' } : { id: 'rae', name: 'Rae' },
  authorize: (context: PlaygroundContext) => context.who === 'admin'
}

export function playgroundContext(cookie: string | undefined): PlaygroundContext {
  return { who: cookie === 'reader' ? 'reader' : 'admin' }
}
