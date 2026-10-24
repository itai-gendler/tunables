import { beforeEach, describe, expect, it } from 'vitest'
import { TunablesError, createTunables, defineGroup, memoryStore, number, toggle, type Guard } from '../support.js'
import { catalogs, effects, groups, presets, scopeLabel, scopes } from '../../examples/tasklane/tunables.js'
import type { StoreUnderTest } from './engine.js'

/** Scoped settings, the same against every store: spec/scopes.md. */
export function scopesSuite(name: string, fresh: () => Promise<StoreUnderTest>): void {
describe(`scopes on ${name}`, () => {
const acme = { workspace: 'acme' }
const dana = { workspace: 'acme', user: 'dana' }
const lee = { workspace: 'acme', user: 'lee' }
let guarded: { path: unknown }[]

function make(current: StoreUnderTest) {
  const seen: Guard = ({ scope }) => {
    guarded.push({ path: scope })
    return undefined
  }
  return createTunables({ store: current.store, groups, presets, catalogs, effects, scopes, scopeLabel, guards: { workspace: [seen] } })
}

let tunables: ReturnType<typeof make>
let current: StoreUnderTest

beforeEach(async () => {
  guarded = []
  current = await fresh()
  tunables = make(current)
  await tunables.sync({ actor: 'test' })
})

describe('definitions', () => {
  it('refuses an override at a scope the chain lacks, a bound on a field that is not a number, and a layer of no group', () => {
    const store = memoryStore()
    const at = (field: ReturnType<typeof number> | ReturnType<typeof toggle>) => defineGroup({ id: 'a', title: 'A', fields: { x: field } })
    expect(() => createTunables({ store, scopes: ['workspace'], groups: [at(number({ unit: 'count', default: 1, override: ['team'] }))] }))
      .toThrow(/team/)
    expect(() => createTunables({ store, scopes: ['workspace'], groups: [at(toggle({ default: false, override: { workspace: 'at-most' } }))] }))
      .toThrow(TunablesError)
    expect(() => createTunables({ store, scopes, groups, catalogs, presets: [{ ...presets[0], layer: { group: 'nothing', scope: 'workspace' } }] }))
      .toThrow(TunablesError)
  })

  it('describes the chain, each field\'s overrides and the plan layer', () => {
    const description = tunables.describe()
    expect(description.scopes).toEqual(['workspace', 'user'])
    const ai = description.groups.find(group => group.id === 'limits')!.fields.find(field => field.key === 'aiSuggestionsPerDay')!
    expect(ai.overrides).toEqual({ workspace: 'at-most', user: 'at-most' })
    expect(description.presets[0]!.layer).toMatchObject({ group: 'limits', scope: 'workspace', slot: 'plan' })
  })
})

describe('reading through the layers', () => {
  it('reads the system, then the plan, then each scope, the most specific winning', async () => {
    expect(await tunables.get('limits')).toMatchObject({ maxProjects: 3, aiSuggestionsPerDay: 20 })
    // Acme is on no plan yet, so it takes the default plan.
    expect(await tunables.get('limits', { scope: acme })).toMatchObject({ maxProjects: 3, aiSuggestionsPerDay: 5 })
    expect((await tunables.presets('plans').assign('acme', 'plan', 'pro', { actor: 'staff' })).saved).toBe(true)
    expect(await tunables.get('limits', { scope: acme })).toMatchObject({ maxProjects: 50, aiSuggestionsPerDay: 100 })

    expect((await tunables.save('workspace', { defaultView: 'board' }, { scope: acme, actor: 'owner' })).saved).toBe(true)
    expect((await tunables.save('workspace', { defaultView: 'calendar' }, { scope: dana, actor: 'dana' })).saved).toBe(true)
    expect((await tunables.get('workspace', { scope: dana })).defaultView).toBe('calendar')
    expect((await tunables.get('workspace', { scope: lee })).defaultView).toBe('board')
    expect((await tunables.get('workspace')).defaultView).toBe('list')
  })

  it('says, for each field a scope may set, what it inherits and from where', async () => {
    await tunables.presets('plans').assign('acme', 'plan', 'pro', { actor: 'staff' })
    await tunables.save('limits', { maxProjects: 20 }, { scope: acme, actor: 'owner' })
    const entry = await tunables.entry('limits', { scope: acme })
    expect(entry.scope).toEqual({ key: 'workspace=acme', path: acme, label: 'Acme' })
    expect(entry.values.maxProjects).toBe(20)
    expect(entry.layers!.maxProjects).toMatchObject({ inherited: 50, from: 'plan:plans:pro', fromLabel: 'Pro plan', overridden: true, rule: 'at-most' })
    expect(entry.layers!.attachmentMb).toMatchObject({ inherited: 100, overridden: false })
    expect(entry.changed).toEqual(['maxProjects'])

    await tunables.save('workspace', { weekStartsOn: 0 }, { scope: acme, actor: 'owner' })
    const person = await tunables.entry('workspace', { scope: dana })
    expect(Object.keys(person.layers!)).toEqual(['defaultView', 'weekStartsOn', 'dueSoonDays', 'reminderHour'])
    expect(person.layers!.weekStartsOn).toMatchObject({ inherited: 0, fromLabel: 'Acme', overridden: false })
    expect(person.layers!.dueSoonDays).toMatchObject({ inherited: 2, fromLabel: 'System' })
  })

  it('keeps the last good values of each scope apart while the store is away', async () => {
    await tunables.save('workspace', { defaultView: 'board' }, { scope: acme, actor: 'owner' })
    expect((await tunables.get('workspace', { scope: acme })).defaultView).toBe('board')
    expect((await tunables.get('workspace')).defaultView).toBe('list')
    current.failReads(true)
    expect((await tunables.get('workspace', { scope: acme, lastGood: true })).defaultView).toBe('board')
    expect((await tunables.get('workspace', { lastGood: true })).defaultView).toBe('list')
    await expect(tunables.get('workspace', { scope: dana, lastGood: true })).rejects.toThrow()
    current.failReads(false)
  })

  it('keeps the values saved in this process as the last good ones', async () => {
    await tunables.save('workspace', { dueSoonDays: 5 }, { actor: 'staff' })
    current.failReads(true)
    expect((await tunables.get('workspace', { lastGood: true })).dueSoonDays).toBe(5)
    current.failReads(false)
  })

  it('refuses a path that names a scope outside the chain or skips a broader one', async () => {
    await expect(tunables.get('workspace', { scope: { team: 't1' } })).rejects.toThrow(/not a scope/)
    await expect(tunables.get('workspace', { scope: { user: 'dana' } })).rejects.toThrow(/must name workspace too/)
    await expect(tunables.get('workspace', { scope: { workspace: 'a;b' } })).rejects.toThrow(TunablesError)
  })
})

describe('saving at a scope', () => {
  it('refuses a field the scope may not set, naming it and the scope', async () => {
    const outcome = await tunables.save('workspace', { reminderHour: 7, defaultView: 'board' }, { scope: acme, actor: 'owner' })
    expect(outcome.saved).toBe(false)
    expect(outcome.problems).toEqual([{ key: 'reminderHour', message: 'Reminder time cannot be set for Acme.' }])
    const model = await tunables.save('workspace', { suggestionModel: 'large' }, { scope: dana, actor: 'dana' })
    expect(model.problems[0]!.message).toBe('Suggestion model cannot be set for Dana.')
  })

  it('keeps a bounded override within the value it inherits', async () => {
    await tunables.presets('plans').assign('acme', 'plan', 'pro', { actor: 'staff' })
    const above = await tunables.save('limits', { maxProjects: 60 }, { scope: acme, actor: 'owner' })
    expect(above.problems).toEqual([{ key: 'maxProjects', message: 'Projects may be at most 50 for Acme, the value it inherits.' }])
    expect((await tunables.save('limits', { aiSuggestionsPerDay: 50 }, { scope: acme, actor: 'owner' })).saved).toBe(true)
    const person = await tunables.save('limits', { aiSuggestionsPerDay: 60 }, { scope: dana, actor: 'dana' })
    expect(person.problems[0]!.message).toBe('AI suggestions a day may be at most 50 for Dana, the value it inherits.')
    expect((await tunables.save('limits', { aiSuggestionsPerDay: 10 }, { scope: dana, actor: 'dana' })).saved).toBe(true)
    expect((await tunables.get('limits', { scope: dana })).aiSuggestionsPerDay).toBe(10)
  })

  it('checks the group\'s rules on the values as the scope reads them, and passes the path to its guards', async () => {
    const outcome = await tunables.save('workspace', { archiveAfterDays: 1 }, { scope: acme, actor: 'owner' })
    expect(outcome.problems).toEqual([{ key: 'dueSoonDays', message: 'Due soon may not be longer than the time before done tasks are archived.' }])
    expect((await tunables.save('workspace', { archiveAfterDays: 7 }, { scope: acme, actor: 'owner' })).saved).toBe(true)
    expect(guarded.at(-1)).toEqual({ path: acme })
  })

  it('uses the inherited value again for a null, and removes an override left with no values', async () => {
    await tunables.save('workspace', { defaultView: 'board', guestAccess: true }, { scope: acme, actor: 'owner', confirmed: true })
    await tunables.save('workspace', { defaultView: null }, { scope: acme, actor: 'owner' })
    let entry = await tunables.entry('workspace', { scope: acme })
    expect(entry.values).toMatchObject({ defaultView: 'list', guestAccess: true })
    expect(entry.layers!.defaultView!.overridden).toBe(false)
    const reset = await tunables.reset('workspace', undefined, { scope: acme, actor: 'owner' })
    expect(reset.saved).toBe(true)
    expect(reset.revision).toMatchObject({ reason: 'Use the inherited values.', snapshot: null })
    entry = await tunables.entry('workspace', { scope: acme })
    expect(entry.changed).toEqual([])
    expect(entry.updatedAt).toBeNull()
    expect(await tunables.store.readScopes('workspace')).toEqual([])
  })
})

describe('a broader change and the overrides under it', () => {
  beforeEach(async () => {
    await tunables.presets('plans').assign('acme', 'plan', 'pro', { actor: 'staff' })
    await tunables.save('limits', { maxProjects: 20, aiSuggestionsPerDay: 50 }, { scope: acme, actor: 'owner' })
    await tunables.save('limits', { aiSuggestionsPerDay: 30 }, { scope: dana, actor: 'dana' })
  })

  it('refuses lowering a workspace below a person\'s override, naming them', async () => {
    const outcome = await tunables.save('limits', { aiSuggestionsPerDay: 10 }, { scope: acme, actor: 'owner' })
    expect(outcome.saved).toBe(false)
    expect(outcome.problems).toEqual([{ message: 'Dana keeps AI suggestions a day at 30, above 10.' }])
  })

  it('refuses moving a workspace to a plan its overrides exceed', async () => {
    const outcome = await tunables.presets('plans').assign('acme', 'plan', 'free', { actor: 'staff' })
    expect(outcome.saved).toBe(false)
    expect(outcome.problems.map(problem => problem.message)).toEqual(expect.arrayContaining([
      expect.stringContaining('Acme keeps Projects at 20, above 3.'),
      expect.stringContaining('Acme keeps AI suggestions a day at 50, above 5.')
    ]))
  })

  it('refuses lowering a plan below what a workspace on it keeps', async () => {
    const outcome = await tunables.presets('plans').update('pro', { values: { maxProjects: 10 } }, { actor: 'staff' })
    expect(outcome.saved).toBe(false)
    expect(outcome.problems.map(problem => problem.message).join(' ')).toContain('Acme keeps Projects at 20, above 10.')
  })

  it('lets a broader value move as long as every override stays within it', async () => {
    expect((await tunables.presets('plans').update('pro', { values: { aiSuggestionsPerDay: 60 } }, { actor: 'staff' })).saved).toBe(true)
    expect((await tunables.save('limits', { aiSuggestionsPerDay: 30 }, { scope: acme, actor: 'owner' })).saved).toBe(true)
    expect((await tunables.get('limits', { scope: dana })).aiSuggestionsPerDay).toBe(30)
  })
})

describe('the rules under a broader change', () => {
  it('refuses a workspace change that breaks the group\'s rules for a person in it, naming them', async () => {
    expect((await tunables.save('workspace', { dueSoonDays: 10 }, { scope: dana, actor: 'dana' })).saved).toBe(true)
    const outcome = await tunables.save('workspace', { archiveAfterDays: 7 }, { scope: acme, actor: 'owner' })
    expect(outcome.saved).toBe(false)
    expect(outcome.problems).toEqual([{ message: 'For Dana: Due soon may not be longer than the time before done tasks are archived.' }])
    await tunables.save('workspace', { dueSoonDays: null }, { scope: dana, actor: 'dana' })
    expect((await tunables.save('workspace', { archiveAfterDays: 7 }, { scope: acme, actor: 'owner' })).saved).toBe(true)
  })
})

describe('a field no longer overridable at a scope', () => {
  it('reads as inherited, and its stored value can still be cleared', async () => {
    await tunables.store.transaction(session => session.writeGroup({ id: 'workspace', scope: 'workspace=acme', values: { reminderHour: 6, defaultView: 'board' }, updatedAt: null, updatedBy: null }))
    const entry = await tunables.entry('workspace', { scope: acme })
    expect(entry.values).toMatchObject({ reminderHour: 9, defaultView: 'board' })
    expect((await tunables.save('workspace', { reminderHour: null }, { scope: acme, actor: 'owner' })).saved).toBe(true)
    expect((await tunables.store.readScopes('workspace'))[0]!.values).toEqual({ defaultView: 'board' })
  })
})

describe('catalogs', () => {
  it('counts a setting that picks an entry as a use of it', async () => {
    const outcome = await tunables.catalog('models').retire('small', { actor: 'staff' })
    expect(outcome.saved).toBe(false)
    expect(outcome.problems[0]!.message).toContain('Workspace › Suggestion model')
    await tunables.save('workspace', { suggestionModel: 'large' }, { actor: 'staff' })
    expect((await tunables.catalog('models').retire('small', { actor: 'staff' })).saved).toBe(true)
  })
})

describe('history and restore at a scope', () => {
  it('keeps a scope\'s revisions apart and restores its own values exactly', async () => {
    const first = await tunables.save('workspace', { defaultView: 'board' }, { scope: acme, actor: 'owner', reason: 'Boards suit us' })
    await tunables.save('workspace', { defaultView: 'calendar', guestAccess: true }, { scope: acme, actor: 'owner', confirmed: true })
    await tunables.save('workspace', { dueSoonDays: 3 }, { actor: 'staff' })

    const scoped = await tunables.history({ kind: 'group', name: 'workspace', id: 'workspace=acme' })
    expect(scoped).toHaveLength(2)
    expect(scoped[1]).toMatchObject({ actor: 'owner', reason: 'Boards suit us', snapshot: { defaultView: 'board' } })
    expect((await tunables.history('workspace')).every(revision => !revision.target.id)).toBe(true)

    const restored = await tunables.restore(first.revision!.id, { actor: 'owner' })
    expect(restored.saved).toBe(true)
    const entry = await tunables.entry('workspace', { scope: acme })
    expect(entry.values).toMatchObject({ defaultView: 'board', guestAccess: false, dueSoonDays: 3 })
    expect(entry.changed).toEqual(['defaultView'])
  })
})
})
}
