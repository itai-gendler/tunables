import { beforeEach, describe, expect, it } from 'vitest'
import {
  TunablesError,
  TunablesMissing,
  createTunables,
  defineGroup,
  defaultsOf,
  memoryStore,
  number,
  type FixtureFeedList,
  type TunablesStore
} from '../support.js'
import { catalogs, collection, collectionNotes, effects, feedsAbove, groups, presets, readers, units } from '../fixtures/news/news.js'

/** A store under test, made empty for each test, with a switch that makes its reads fail. */
export interface StoreUnderTest {
  store: TunablesStore
  failReads(failing: boolean): void
}

/** The engine's behaviour, the same against every store. */
export function engineSuite(name: string, fresh: () => Promise<StoreUnderTest>): void {
describe(`engine on ${name}`, () => {
let feeds: FixtureFeedList
let current: StoreUnderTest
const explanations = {
  'run-settings': { title: 'Run Settings', facts: { 'Budget limit': { text: 'The most one Run may spend.', default: '25 dollars' } } }
}

function make(store: TunablesStore = current.store) {
  return createTunables({
    store,
    groups,
    presets,
    catalogs,
    effects,
    units,
    explanations,
    guards: { collection: [feedsAbove(() => feeds)] },
    notes: { collection: collectionNotes(() => feeds) }
  })
}

let tunables: ReturnType<typeof make>

beforeEach(async () => {
  current = await fresh()
  feeds = [
    { name: 'Ars Technica', maxArticles: 300, lookbackDays: 30, official: true },
    { name: 'A blog', maxArticles: 10, lookbackDays: 3, official: false }
  ]
  tunables = make()
  await tunables.sync({ actor: 'test' })
})

describe('definitions', () => {
  it('refuses a unit, effect or default that does not exist or hold', () => {
    const store = memoryStore()
    expect(() => createTunables({ store, groups: [defineGroup({ id: 'a', title: 'A', fields: { x: number({ unit: 'furlongs', default: 1 }) } })] }))
      .toThrow(/not a unit/)
    expect(() => createTunables({ store, groups: [defineGroup({ id: 'a', title: 'A', fields: { x: number({ unit: 'count', default: 1, affects: ['moon'] }) } })] }))
      .toThrow(/not an effect/)
    expect(() => createTunables({ store, groups: [defineGroup({ id: 'a', title: 'A', fields: { x: number({ unit: 'count', default: 0 }) } })] }))
      .toThrow(/default does not pass/)
    expect(() => createTunables({ store, groups: [collection, collection] })).toThrow(TunablesError)
  })

  it('describes every field with its explanation, unit and default as a person reads them', () => {
    const description = tunables.describe()
    const budget = description.groups.find(group => group.id === 'run')!.fields.find(field => field.key === 'budgetLimitUsd')!
    expect(budget).toMatchObject({ label: 'Budget limit', help: 'The most one Run may spend.', unit: { id: 'dollars' }, integer: false, default: 25, defaultDisplay: '$25' })
    expect(description.groups[0]!.sections[0]).toBe('Scheduled collection and the worker')
    expect(description.presets[0]).toMatchObject({ id: 'run-configs', slots: ['daily', 'weekly'] })
    expect(description.effects.cost).toMatchObject({ warn: true })
  })
})

describe('reading', () => {
  it('reads nothing before sync, then the defaults, typed', async () => {
    const unsynced = make(memoryStore())
    await expect(unsynced.get('run')).rejects.toBeInstanceOf(TunablesMissing)
    await unsynced.sync()
    const values = await unsynced.get('run')
    expect(values.budgetLimitUsd).toBe(25)
    expect(values.storySummaryLength).toEqual({ min: 40, max: 360 })
  })

  it('reports a field the stored group lacks instead of falling back to its default', async () => {
    const store = memoryStore()
    await store.writeGroup({ id: 'readers', scope: '', values: { briefsPerReader: 3 }, updatedAt: null, updatedBy: null })
    const partial = createTunables({ store, groups: [readers], effects })
    await expect(partial.get('readers')).rejects.toThrow(/lack feedsPerBrief/)
    const report = await partial.sync()
    expect(report.added.map(item => item.key)).toEqual(['feedsPerBrief', 'examplesPerBrief', 'aboutMeCharacters', 'briefNameCharacters', 'siteChecksPerHour'])
    expect((await partial.get('readers')).briefsPerReader).toBe(3)
  })

  it('keeps unknown stored fields and reports them', async () => {
    const store = memoryStore()
    await store.writeGroup({ id: 'readers', scope: '', values: { ...defaultsOf(readers.fields), briefsPerReader: 3, retired: 1 }, updatedAt: null, updatedBy: null })
    const report = await createTunables({ store, groups: [readers], effects }).sync()
    expect(report.unknown).toEqual([{ group: 'readers', key: 'retired' }])
    expect((await store.readGroups(['readers']))[0]!.values.retired).toBe(1)
  })

  it('keeps the last good values for a reader that asks, when a read fails', async () => {
    await tunables.get('readers')
    current.failReads(true)
    await expect(tunables.get('readers')).rejects.toThrow(/unreachable/)
    expect((await tunables.get('readers', { lastGood: true })).briefsPerReader).toBe(12)
    current.failReads(false)
  })

  it('gives an entry with what changed from default, readable values and notes', async () => {
    await tunables.save('collection', { checkIntervalMinutes: 10 }, { actor: 'Ada' })
    const entry = await tunables.entry('collection')
    expect(entry.changed).toEqual(['checkIntervalMinutes'])
    expect(entry.display.values.checkIntervalMinutes).toBe('10 minutes')
    expect(entry.display.defaults.imageMinimum).toBe('400 × 225 pixels')
    expect(entry.notes.scheduledCollection).toEqual(['Every Feed would collect 1 official Feed.'])
    expect(entry.updatedBy).toBe('Ada')
  })
})

describe('saving', () => {
  it('names every field that does not hold, in its own words', async () => {
    const outcome = await tunables.save('collection', { checkIntervalMinutes: 0, scheduledCollection: 'weekly' as never, largestResponseMegabytes: 2.5 })
    expect(outcome.saved).toBe(false)
    expect(outcome.problems).toEqual([
      { key: 'checkIntervalMinutes', message: 'Check interval must be more than 0.' },
      { key: 'scheduledCollection', message: 'Scheduled collection must be one of: Off, Feeds Briefs read, Every Feed.' }
    ])
  })

  it('refuses a field no definition declares', async () => {
    const outcome = await tunables.save('readers', { moonPhase: 3 } as never)
    expect(outcome.problems[0]!.message).toBe('Reader Limits has no "moonPhase".')
  })

  it('checks settings that bound one another', async () => {
    const outcome = await tunables.save('collection', { newFeedLookbackDays: 400 })
    expect(outcome.problems).toEqual([{ message: 'New-feed lookback days may not exceed the Longest lookback.' }])
  })

  it('records one revision per change, with each value before and after', async () => {
    const outcome = await tunables.save('readers', { briefsPerReader: 7, feedsPerBrief: 40 }, { actor: { id: 'u1', name: 'Ada' }, reason: 'More room' })
    expect(outcome.saved).toBe(true)
    expect(outcome.revision).toMatchObject({ actor: 'Ada', reason: 'More room', changes: [{ key: 'briefsPerReader', from: 12, to: 7 }] })
    expect(outcome.value!.values.briefsPerReader).toBe(7)
    const history = await tunables.history('readers')
    expect(history.map(revision => revision.reason)).toEqual(['More room', 'Seeded with the defaults.'])
  })

  it('records nothing when nothing changed', async () => {
    const outcome = await tunables.save('readers', { briefsPerReader: 12 })
    expect(outcome.saved).toBe(true)
    expect(outcome.revision).toBeUndefined()
    expect(await tunables.history('readers')).toHaveLength(1)
  })

  it('asks to confirm a change with consequences, and saves it confirmed', async () => {
    const asked = await tunables.save('run', { screeningReasonWords: 40 })
    expect(asked.saved).toBe(false)
    expect(asked.confirm).toMatch(/redoes every saved Screening judgment/)
    expect((await tunables.get('run')).screeningReasonWords).toBe(12)
    const confirmed = await tunables.save('run', { screeningReasonWords: 40 }, { confirmed: true })
    expect(confirmed.saved).toBe(true)
  })

  it('refuses lowering a bound below a Feed of the host app, naming it', async () => {
    const outcome = await tunables.save('collection', { maxArticlesPerRetrieval: 250, newFeedMaxArticles: 100 })
    expect(outcome.problems).toEqual([{ message: 'Feed "Ars Technica" reads 300 articles, above the Most articles per retrieval of 250.' }])
  })

  it('refuses lowering a limit below a Run Config, naming it', async () => {
    const outcome = await tunables.save('run', { screeningBudgetLimitUsd: 0.2 })
    expect(outcome.problems).toEqual([{ message: 'Run Config "Weekly brief": its Screening budget, $0.30, is above the Screening budget limit of $0.20.' }])
    expect((await tunables.save('run', { screeningBudgetLimitUsd: 0.3 })).saved).toBe(true)
  })

  it('resets chosen fields, or a whole group, to their defaults', async () => {
    await tunables.save('readers', { briefsPerReader: 9, feedsPerBrief: 30 })
    await tunables.reset('readers', ['briefsPerReader'])
    expect(await tunables.get('readers')).toMatchObject({ briefsPerReader: 12, feedsPerBrief: 30 })
    const outcome = await tunables.reset('readers')
    expect(outcome.revision?.reason).toBe('Reset to defaults.')
    expect((await tunables.get('readers')).feedsPerBrief).toBe(40)
  })

  it('restores an earlier revision through the same checks', async () => {
    const first = await tunables.save('readers', { briefsPerReader: 9 })
    await tunables.save('readers', { briefsPerReader: 2, aboutMeCharacters: 500 })
    const restored = await tunables.restore(first.revision!.id, { actor: 'Ada', reason: 'Too tight' })
    expect(restored.saved).toBe(true)
    expect(restored.revision?.reason).toBe(`Restored revision ${first.revision!.id}. Too tight`)
    expect(await tunables.get('readers')).toMatchObject({ briefsPerReader: 9, aboutMeCharacters: 1500 })
  })

  it('refuses a restore that would now break a Run Config', async () => {
    const lowered = await tunables.save('run', { screeningBudgetLimitUsd: 0.3 })
    await tunables.save('run', { screeningBudgetLimitUsd: 3 })
    const weekly = tunables.presets('run-configs')
    expect((await weekly.update('weekly', { values: { screeningMaxBudgetUsd: 2.5 } })).saved).toBe(true)
    const restored = await tunables.restore(lowered.revision!.id)
    expect(restored.saved).toBe(false)
    expect(restored.problems[0]!.message).toMatch(/Run Config "Weekly brief": its Screening budget, \$2.50/)
  })

  it('names every problem at once: kinds and rules, presets and every guard', async () => {
    const kinds = await tunables.save('collection', { checkIntervalMinutes: 0, newFeedLookbackDays: 400 })
    expect(kinds.problems.map(problem => problem.message)).toEqual([
      'Check interval must be more than 0.',
      'New-feed lookback days may not exceed the Longest lookback.'
    ])
    const store = memoryStore()
    const strict = createTunables({
      store, groups, presets, catalogs, effects, units,
      guards: { run: [() => ['First guard.'], () => ['Second guard.']] }
    })
    await strict.sync()
    const refused = await strict.save('run', { screeningBudgetLimitUsd: 0.2 })
    expect(refused.problems.map(problem => problem.message)).toEqual([
      'Run Config "Weekly brief": its Screening budget, $0.30, is above the Screening budget limit of $0.20.',
      'First guard.',
      'Second guard.'
    ])
  })

  it('records a revision on every target a change reaches', async () => {
    const set = tunables.presets('run-configs')
    await set.create({ key: 'light', slot: 'daily', label: 'Light', values: { maxBudgetUsd: 0.05 } })
    await set.makeDefault('light', { actor: 'Ada' })
    expect((await tunables.history({ kind: 'preset', name: 'run-configs', id: 'daily' }))[0]).toMatchObject({ reason: '"Light" became the default for daily.', changes: [{ key: 'default', from: true, to: false }] })
    await set.makeDefault('daily')
    await set.assign('reader-1', 'daily', 'light')
    await set.remove('light', { actor: 'Ada' })
    expect((await tunables.history({ kind: 'assignment', name: 'run-configs', id: 'reader-1' }))[0]).toMatchObject({ actor: 'Ada', changes: [{ key: 'daily', from: 'light', to: null }] })
  })

  it('adds a field newly declared on a preset set to every stored preset', async () => {
    const [daily] = await current.store.listRecords('preset:run-configs')
    const { maxStories: _dropped, ...older } = (daily!.data.values as Record<string, unknown>)
    await current.store.putRecord({ collection: 'preset:run-configs', id: daily!.id, data: { ...daily!.data, values: older } })
    const report = await tunables.sync()
    expect(report.added).toEqual([{ group: 'run-configs:daily', key: 'maxStories' }])
    expect((await tunables.presets('run-configs').get('daily'))!.values.maxStories).toBe(10)
  })

  it('records no actor for a sync nobody named', async () => {
    const fresh = make(memoryStore())
    await fresh.sync()
    expect((await fresh.history('readers'))[0]!.actor).toBeNull()
  })

  it('refuses seeds that do not hold', () => {
    const broken = { ...catalogs[0], seed: [{ id: 'x', values: { ...catalogs[0].seed![0]!.values, contextWindowTokens: 0 } }] }
    expect(() => createTunables({ store: memoryStore(), groups, presets, catalogs: [broken], effects, units })).toThrow(/models\.x's seed does not hold: Context window must be more than 0\./)
  })

  it('tells listeners in this process after a change commits', async () => {
    const heard: number[] = []
    const stop = tunables.onChange('readers', values => heard.push(values.briefsPerReader))
    await tunables.save('readers', { briefsPerReader: 6 })
    await tunables.save('readers', { briefsPerReader: 0 })
    stop()
    await tunables.save('readers', { briefsPerReader: 8 })
    expect(heard).toEqual([6])
  })
})

describe('presets', () => {
  it('seeds one default per slot, and resolves a subject to the default', async () => {
    const set = tunables.presets('run-configs')
    expect((await set.list()).map(preset => [preset.key, preset.slot, preset.isDefault])).toEqual([['daily', 'daily', true], ['weekly', 'weekly', true]])
    const resolved = await set.resolve('reader-1', 'weekly')
    expect(resolved).toMatchObject({ key: 'weekly', assigned: false })
    expect(resolved.values.maxStories).toBe(15)
  })

  it('creates a preset only with a valid key, slot, model, effort and within the limits', async () => {
    const set = tunables.presets('run-configs')
    expect((await set.create({ key: 'Light One', slot: 'daily', label: 'Light' })).problems[0]!.message).toMatch(/lowercase letters/)
    expect((await set.create({ key: 'light', slot: 'hourly', label: 'Light' })).problems[0]!.message).toMatch(/daily, weekly/)
    expect((await set.create({ key: 'light', slot: 'daily', label: 'Light', values: { model: 'gpt-9' } })).problems[0]!.message).toBe('Model: "gpt-9" is not in Models.')
    expect((await set.create({ key: 'light', slot: 'daily', label: 'Light', values: { effort: 'none' } })).problems)
      .toEqual([{ key: 'effort', message: 'GPT-OSS 120B (Groq) does not take effort "none".' }])
    expect((await set.create({ key: 'light', slot: 'daily', label: 'Light', values: { maxTurns: 500 } })).problems)
      .toEqual([{ message: 'its Turns, 500, are above the Turns limit of 400.' }])
    const created = await set.create({ key: 'light', slot: 'daily', label: 'Light', values: { maxBudgetUsd: 0.05 } }, { actor: 'Ada' })
    expect(created.saved).toBe(true)
    expect(created.value).toMatchObject({ key: 'light', isDefault: false })
    expect((await set.create({ key: 'light', slot: 'daily', label: 'Again' })).problems[0]!.message).toMatch(/already exists/)
  })

  it('assigns by reference, follows the default again, and pins the default explicitly', async () => {
    const set = tunables.presets('run-configs')
    await set.create({ key: 'light', slot: 'daily', label: 'Light', values: { maxBudgetUsd: 0.05 } })
    expect((await set.assign('reader-1', 'daily', 'weekly')).problems[0]!.message).toBe('"Weekly brief" fills weekly, not daily.')
    await set.assign('reader-1', 'daily', 'light')
    expect(await set.resolve('reader-1', 'daily')).toMatchObject({ key: 'light', assigned: true })
    await set.update('light', { values: { maxStories: 3 } })
    expect((await set.resolve('reader-1', 'daily')).values.maxStories).toBe(3)
    await set.assign('reader-1', 'daily', null)
    expect(await set.resolve('reader-1', 'daily')).toMatchObject({ key: 'daily', assigned: false })
    await set.assign('reader-1', 'daily', 'daily')
    await set.makeDefault('light')
    expect(await set.resolve('reader-1', 'daily')).toMatchObject({ key: 'daily', assigned: true })
    expect(await set.resolve('reader-2', 'daily')).toMatchObject({ key: 'light', assigned: false })
  })

  it('keeps the default, and returns the assigned to the default when a preset is removed', async () => {
    const set = tunables.presets('run-configs')
    expect((await set.remove('daily')).problems[0]!.message).toMatch(/make another the default first/)
    await set.create({ key: 'light', slot: 'daily', label: 'Light', values: { maxBudgetUsd: 0.05 } })
    await set.assign('reader-1', 'daily', 'light')
    const removed = await set.remove('light', { actor: 'Ada' })
    expect(removed.revision?.reason).toBe('1 assigned returned to the default.')
    expect(await set.resolve('reader-1', 'daily')).toMatchObject({ key: 'daily', assigned: false })
    expect(await set.assignments('reader-1')).toEqual([])
  })

  it('records each preset change as a revision of that preset', async () => {
    const set = tunables.presets('run-configs')
    await set.update('daily', { label: 'Daily', values: { maxStories: 6 } }, { actor: 'Ada' })
    const history = await tunables.history({ kind: 'preset', name: 'run-configs', id: 'daily' })
    expect(history[0]!.changes).toEqual([{ key: 'label', from: 'Daily brief', to: 'Daily' }, { key: 'maxStories', from: 10, to: 6 }])
  })
})

describe('catalogs', () => {
  it('adds, edits and retires entries, never dropping one', async () => {
    const models = tunables.catalog('models')
    expect((await models.list()).map(entry => entry.id)).toEqual(['openai/gpt-oss-120b', 'openai/gpt-oss-20b'])
    const added = await models.add({ id: 'qwen/qwen3-32b', values: { label: 'Qwen3 32B', efforts: [] } })
    expect(added.saved).toBe(true)
    expect((await models.add({ id: 'qwen/qwen3-32b', values: { label: 'Again' } })).problems[0]!.message).toMatch(/already holds/)
    expect((await models.add({ id: 'x', values: { label: '' } })).problems[0]!.message).toBe('Label may not be empty.')
    expect((await models.retire('qwen/qwen3-32b')).saved).toBe(true)
    expect((await models.available()).map(entry => entry.id)).not.toContain('qwen/qwen3-32b')
    expect((await models.reinstate('qwen/qwen3-32b')).value?.state).toBe('available')
  })

  it('keeps an entry in use available, naming what uses it', async () => {
    const outcome = await tunables.catalog('models').retire('openai/gpt-oss-20b')
    expect(outcome.problems[0]!.message).toBe('GPT-OSS 20B (Groq) is in use by Run Config "Daily brief", Run Config "Weekly brief"; move them to another model first.')
  })

  it('refuses taking away an effort a preset uses', async () => {
    const outcome = await tunables.catalog('models').edit('openai/gpt-oss-120b', { efforts: ['low'] })
    expect(outcome.problems[0]!.message).toBe('Run Config "Daily brief": GPT-OSS 120B (Groq) does not take effort "high".')
  })

  it('refuses picking a retired entry, but keeps one a preset already had', async () => {
    const models = tunables.catalog('models')
    const set = tunables.presets('run-configs')
    await models.add({ id: 'old', values: { label: 'Old', efforts: [] } })
    await set.create({ key: 'old-one', slot: 'daily', label: 'Old one', values: { model: 'old', effort: 'none' } })
    await set.update('old-one', { values: { model: 'openai/gpt-oss-120b', effort: 'high' } })
    await models.retire('old')
    expect((await set.update('old-one', { values: { model: 'old', effort: 'none' } })).problems[0]!.message).toMatch(/is retired; choose an Available model/)
  })
})
})
}
