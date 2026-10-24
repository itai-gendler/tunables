import { beforeAll, describe, expect, it } from 'vitest'
import { tunables } from '../cli-support.js'
import { DATABASE_URL, drivers } from './database.js'

const env = { TUNABLES_FIXTURE_DATABASE_URL: DATABASE_URL }
const run = (...args: string[]) => tunables(['--cwd', 'test/fixtures/news', ...args], { env })

beforeAll(async () => {
  await drivers['postgres.js']!.query('drop schema if exists fixture cascade')
})

describe('database commands on the fixture', () => {
  it('seeds, refuses, confirms, records and restores, as the screens do', async () => {
    const sync = await run('sync')
    expect(sync.stdout).toContain('✓ seeded run with its defaults')
    expect((await run('sync')).stdout).toContain('Everything is in place.')

    const refused = await run('set', 'run', 'screeningBudgetLimitUsd=0.2', '--reason', 'Cheaper')
    expect(refused.code).toBe(1)
    expect(refused.stderr).toContain('Run Config "Weekly brief": its Screening budget, $0.30, is above the Screening budget limit of $0.20.')

    const asked = await run('set', 'run', 'screeningReasonWords=20', '--reason', 'Longer reasons')
    expect(asked.code).toBe(1)
    expect(asked.stderr).toContain('Pass --yes')
    expect((await run('set', 'run', 'screeningReasonWords=20', '--reason', 'Longer reasons', '--yes')).stdout).toMatch(/Saved as revision \d+/)
    expect(JSON.parse((await run('get', 'run', 'screeningReasonWords', '--json')).stdout)).toBe(20)

    const set = await run('set', 'readers', 'briefsPerReader=3', 'aboutMeCharacters=900', '--reason', 'Tighter')
    expect(set.code).toBe(0)
    const history = JSON.parse((await run('history', 'readers', '--json')).stdout)
    expect(history[0]).toMatchObject({ reason: 'Tighter', changes: [{ key: 'briefsPerReader', from: 12, to: 3 }, { key: 'aboutMeCharacters', from: 1500, to: 900 }] })
    expect(history[0].actor).toMatch(/\(terminal\)$/)

    const seed = history.at(-1).id as string
    expect((await run('restore', seed, '--reason', 'Back to the seed')).code).toBe(0)
    expect(JSON.parse((await run('get', 'readers', '--json')).stdout)).toMatchObject({ briefsPerReader: 12, aboutMeCharacters: 1500 })
    expect((await run('get', 'readers', 'briefsPerReader')).stdout).toContain('briefsPerReader  12')
  })
})

describe('database commands at a scope', () => {
  const tasklane = (...args: string[]) => tunables(['--cwd', 'examples/tasklane', ...args], { env: { DATABASE_URL } })

  it('reads, sets, refuses, inherits and lists history for one workspace', async () => {
    await drivers['postgres.js']!.query('drop schema if exists tasklane cascade')
    expect((await tasklane('sync')).code).toBe(0)

    const read = await tasklane('get', 'limits', '--scope', 'workspace=acme')
    expect(read.stdout).toMatch(/maxProjects\s+3 {2}\(from Free plan\)/)

    const above = await tasklane('set', 'limits', 'maxProjects=5', '--scope', 'workspace=acme', '--reason', 'More')
    expect(above.code).toBe(1)
    expect(above.stderr).toContain('Projects may be at most 3 for Acme, the value it inherits.')

    expect((await tasklane('set', 'limits', 'maxProjects=2', '--scope', 'workspace=acme', '--reason', 'Fewer')).code).toBe(0)
    expect((await tasklane('get', 'limits', 'maxProjects', '--scope', 'workspace=acme')).stdout).toContain('2  (set here; inherits 3 from Free plan)')
    expect(JSON.parse((await tasklane('get', 'limits', 'maxProjects', '--json')).stdout)).toBe(3)

    expect((await tasklane('set', 'limits', '--inherit', 'maxProjects', '--scope', 'workspace=acme', '--reason', 'Plan is fine')).code).toBe(0)
    const history = JSON.parse((await tasklane('history', 'limits', '--scope', 'workspace=acme', '--json')).stdout)
    expect(history.map((revision: { reason: string }) => revision.reason)).toEqual(['Plan is fine', 'Fewer'])

    const outside = await tasklane('get', 'limits', '--scope', 'user=dana')
    expect(outside.code).not.toBe(0)
    expect(outside.stderr).toContain('must name workspace too')
  })
})
