import type { StoreSession, TunablesStore } from '../src/index.js'

export * from '../src/index.js'
export type FixtureFeedList = import('../fixture/news.js').FixtureFeed[]

/** Wrap a store so its group reads can be made to fail, as an unreachable database would. */
export function failable(store: TunablesStore): { store: TunablesStore, failReads(failing: boolean): void } {
  let failing = false
  const guard = (session: StoreSession): StoreSession => ({
    ...session,
    readGroups: async (ids) => {
      if (failing) throw new Error('The database is unreachable.')
      return session.readGroups(ids)
    }
  })
  const wrapped: TunablesStore = {
    ...guard(store),
    transaction: work => store.transaction(session => work(guard(session))),
    within: store.within ? host => guard(store.within!(host)) : undefined
  }
  return { store: wrapped, failReads: value => { failing = value } }
}
