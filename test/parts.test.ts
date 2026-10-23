import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import {
  EnvironmentError,
  createTunables,
  defineEnvironment,
  defineGroup,
  env,
  memoryStore,
  pick,
  renderEnvExample
} from '../src/index.js'
import { setForTest, testTunables } from '../src/testing.js'
import { checkAgainstModel, draftFacts, readModelFacts, renderExplanations, sameDefault } from '../src/pdd/index.js'
import { displayValue } from '../src/client/format.js'
import { catalogs, effects, groups, models, presets, run, units } from '../fixture/news.js'

describe('deployment values', () => {
  const environment = defineEnvironment({
    DATABASE_URL: env.string({ description: 'The database.' }),
    BATCH: env.integer({ default: 500, description: 'Rows per statement.', section: 'Mechanics' }),
    RATIO: env.number({ default: 0.5, min: 0, max: 1, description: 'A share.' }),
    VERBOSE: env.boolean({ default: false, description: 'Log more.' }),
    LEVEL: env.choice({ options: ['info', 'warn'], default: 'info', description: 'How much to log.' })
  })

  it('reads every value with its default, typed', () => {
    expect(environment.read({ DATABASE_URL: 'postgres://x', VERBOSE: 'yes' })).toEqual({ DATABASE_URL: 'postgres://x', BATCH: 500, RATIO: 0.5, VERBOSE: true, LEVEL: 'info' })
    expect(environment.get('BATCH', { BATCH: '25' })).toBe(25)
  })

  it('names every value that is missing or malformed at once', () => {
    let caught: EnvironmentError | undefined
    try {
      environment.read({ BATCH: '2.5', RATIO: '2', VERBOSE: 'maybe', LEVEL: 'loud' })
    } catch (error) {
      caught = error as EnvironmentError
    }
    expect(caught?.problems.map(problem => `${problem.name} ${problem.message}`)).toEqual([
      'DATABASE_URL is required and not set.',
      'BATCH must be a whole number, not "2.5".',
      'RATIO may not be more than 1.',
      'VERBOSE must be true or false, not "maybe".',
      'LEVEL must be one of info, warn, not "loud".'
    ])
  })

  it('writes .env.example with every value under its description', () => {
    expect(renderEnvExample(environment, 'The app')).toBe(`# The app

# The database.
DATABASE_URL=

# --- Mechanics

# Rows per statement.
# BATCH=500

# A share.
# RATIO=0.5

# Log more.
# VERBOSE=false

# How much to log.
# One of: info, warn.
# LEVEL=info
`)
  })
})

describe('pick fields in a group', () => {
  it('must name an Available entry of their catalog', async () => {
    const writing = defineGroup({ id: 'writing', title: 'Writing', fields: { model: pick({ label: 'Default model', catalog: 'models', default: 'openai/gpt-oss-20b' }) } })
    const tunables = createTunables({ store: memoryStore(), groups: [writing], catalogs: [models], units, effects })
    await tunables.sync()
    expect((await tunables.save('writing', { model: 'gpt-9' })).problems).toEqual([{ key: 'model', message: 'Default model: "gpt-9" is not in Models.' }])
    await tunables.catalog('models').add({ id: 'old', values: { label: 'Old', efforts: [] } })
    await tunables.catalog('models').retire('old')
    expect((await tunables.save('writing', { model: 'old' })).problems[0]!.message).toMatch(/is retired/)
    expect((await tunables.save('writing', { model: 'openai/gpt-oss-120b' })).saved).toBe(true)
  })
})

describe('testing kit', () => {
  it('gives an app its tunables in memory, synced, with values set for a test', async () => {
    const tunables = await testTunables({ groups, presets, catalogs, units, effects })
    expect((await tunables.get('run')).budgetLimitUsd).toBe(25)
    await setForTest(tunables, { run: { budgetLimitUsd: 0.01 } })
    expect((await tunables.get('run')).budgetLimitUsd).toBe(0.01)
    expect((await tunables.history('run'))[0]).toMatchObject({ actor: 'test', reason: 'Set for a test.' })
    await expect(setForTest(tunables, { run: { moon: 1 } })).rejects.toThrow(/has no moon/)
  })
})

describe('Product Model link', () => {
  const directory = join(import.meta.dirname, '../fixture/product-model')

  it('reads each fact with its text and the default it states', async () => {
    const model = await readModelFacts(directory)
    expect(model['run-settings']!.facts['Budget limit']).toEqual({ text: 'The most any Run may spend.', default: '25 dollars' })
    expect(model['run-settings']!.facts['Story limit']).toEqual({ text: 'The most Stories any Edition may hold; it is never more than Sections per edition times Stories per section.', default: '24' })
    expect(renderExplanations(model)).toContain("import type { Explanations } from 'tunables'")
  })

  it('compares defaults by their numbers, or by their words', () => {
    expect(sameDefault('25 dollars', '$25')).toBe(true)
    expect(sameDefault('100,000 characters', '100,000 characters')).toBe(true)
    expect(sameDefault('400 by 225 pixels', '400 × 225 pixels')).toBe(true)
    expect(sameDefault('23:00', '23:00')).toBe(true)
    expect(sameDefault('Feeds Briefs read', 'Feeds Briefs read')).toBe(true)
    expect(sameDefault('On', 'Off')).toBe(false)
    expect(sameDefault('2 MB', '3 MB')).toBe(false)
  })

  it('finds a fact the model lacks and a default that disagrees, and drafts what is missing', async () => {
    const model = await readModelFacts(directory)
    const { rules: _rules, confirm: _confirm, ...plain } = run
    const drifted = defineGroup({
      ...plain,
      fields: { ...run.fields, budgetLimitUsd: { ...run.fields.budgetLimitUsd, default: 30 }, moonPhase: { ...run.fields.turnsLimit, fact: 'Moon phase', help: 'How full the moon must be.' } }
    })
    const description = createTunables({ store: memoryStore(), groups: [drifted], effects, units }).describe()
    expect(checkAgainstModel(description, model)).toEqual([
      { at: 'run.budgetLimitUsd', message: 'defaults to $30, but Run Settings says "Budget limit" defaults to 25 dollars.' },
      { at: 'run.moonPhase', message: 'names the fact "Moon phase", which Run Settings does not keep.' }
    ])
    expect(draftFacts(description, model)).toContain('- **Moon phase** — how full the moon must be; defaults to 400')
  })
})

describe('displayValue', () => {
  it('reads a value the way the server reads a stored one', () => {
    const description = createTunables({ store: memoryStore(), groups, presets, catalogs, units, effects }).describe()
    const field = (group: string, key: string) => description.groups.find(item => item.id === group)!.fields.find(item => item.key === key)!
    expect(displayValue(field('run', 'budgetLimitUsd'), 0.5)).toBe('$0.50')
    expect(displayValue(field('run', 'latestWriteHour'), 7)).toBe('07:00')
    expect(displayValue(field('run', 'storySummaryLength'), { min: 40, max: 360 })).toBe('40–360 characters')
    expect(displayValue(field('collection', 'imageMinimum'), { width: 400, height: 225 })).toBe('400 × 225 pixels')
    expect(displayValue(field('collection', 'scheduledCollection'), 'every-feed')).toBe('Every Feed')
    expect(displayValue(field('collection', 'newFeedFullText'), false)).toBe('Off')
  })
})
