import { createTunables, type AnyTunables, type TunablesOptions } from './engine/tunables.js'
import { memoryStore } from './engine/memory-store.js'
import { defaultsOf, type AnyGroup } from './model/definitions.js'

/**
 * Helpers for an app's own tests: its tunables in memory, seeded, with values
 * a test needs set directly. Nothing here touches a database.
 */

/** The app's tunables over an in-memory store, synced, so every group reads its defaults. */
export async function testTunables<const G extends readonly AnyGroup[]>(options: Omit<TunablesOptions<G>, 'store'> & { store?: TunablesOptions<G>['store'] }) {
  const tunables = createTunables({ ...options, store: options.store ?? memoryStore() })
  await tunables.sync({ actor: 'test' })
  return tunables
}

/**
 * Store values for a test as they are, past guards, confirmations and cross-setting
 * rules (each field's own check still applies), so a test can start where it needs
 * to. Recorded as a revision by "test".
 */
export async function setForTest(
  tunables: AnyTunables,
  values: Record<string, Record<string, unknown>>
): Promise<void> {
  await tunables.store.transaction(async (session) => {
    for (const [id, changes] of Object.entries(values)) {
      const group = tunables.definitions.groups.find(item => item.id === id)
      if (!group) throw new Error(`No group "${id}" is defined.`)
      const unknown = Object.keys(changes).filter(key => !(key in group.fields))
      if (unknown.length) throw new Error(`${group.title} has no ${unknown.join(', ')}.`)
      const [row] = await session.readGroups([id])
      const next = { ...defaultsOf(group.fields), ...row?.values, ...changes }
      await session.writeGroup({ id, values: next, updatedAt: new Date().toISOString(), updatedBy: 'test' })
      await session.appendRevision({
        target: { kind: 'group', name: id },
        actor: 'test',
        reason: 'Set for a test.',
        changes: Object.entries(changes).map(([key, to]) => ({ key, from: row?.values[key] ?? null, to })),
        snapshot: next
      })
    }
  })
  for (const id of Object.keys(values)) await tunables.get(id)
}

export { memoryStore }
