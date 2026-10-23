import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { fixtureCopy, root, tunables } from './cli-support.js'

const cleanup: (() => void)[] = []
afterEach(() => cleanup.splice(0).forEach(remove => remove()))

describe('the command', () => {
  it('shows its version and its commands', async () => {
    const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version
    expect((await tunables(['--version'])).stdout.trim()).toBe(version)
    const help = await tunables([])
    expect(help.code).toBe(0)
    for (const command of ['check', 'env', 'explain', 'model', 'sync', 'get', 'set', 'history', 'restore', 'install', 'update']) expect(help.stdout).toContain(`  ${command}`)
  })

  it('answers a usage mistake with exit code 2', async () => {
    expect((await tunables(['moon'])).code).toBe(2)
    expect((await tunables(['--cwd', 'fixture', 'set', 'run', 'turnsLimit=1'])).code).toBe(2)
    const nowhere = mkdtempSync(join(tmpdir(), 'tunables-none-'))
    cleanup.push(() => rmSync(nowhere, { recursive: true, force: true }))
    const missing = await tunables(['check'], { cwd: nowhere })
    expect(missing.code).toBe(2)
    expect(missing.stderr).toContain('No tunables config here')
  })
})

describe('check', () => {
  it('passes on the fixture: news\'s definitions agree with news\'s Product Model', async () => {
    const result = await tunables(['--cwd', 'fixture', 'check'])
    expect(result.stdout).toContain('every field\'s fact and default agree with the Product Model')
    expect(result.code).toBe(0)
  })

  it('names a stale .env.example, stale explanations and a default the model disagrees with', async () => {
    const copy = fixtureCopy()
    cleanup.push(copy.remove)
    writeFileSync(join(copy.directory, 'env.example'), '# stale\n')
    const entity = join(copy.directory, 'product-model/entities/run-settings.md')
    writeFileSync(entity, readFileSync(entity, 'utf8').replace('defaults to 25 dollars', 'defaults to 30 dollars'))
    const result = await tunables(['--cwd', copy.directory, 'check', '--json'])
    expect(result.code).toBe(1)
    const findings = JSON.parse(result.stdout).findings.map((finding: { check: string }) => finding.check)
    expect(findings).toEqual(['environment', 'explanations', 'model'])
    expect(result.stdout).toContain('run.budgetLimitUsd defaults to $25, but Run Settings says \\"Budget limit\\" defaults to 30 dollars.')
  })

  it('writes .env.example and the explanations, and says when they are current', async () => {
    const copy = fixtureCopy()
    cleanup.push(copy.remove)
    writeFileSync(join(copy.directory, 'env.example'), '')
    expect((await tunables(['--cwd', copy.directory, 'env', '--check'])).code).toBe(1)
    expect((await tunables(['--cwd', copy.directory, 'env'])).code).toBe(0)
    expect((await tunables(['--cwd', copy.directory, 'env', '--check'])).code).toBe(0)
    expect(readFileSync(join(copy.directory, 'env.example'), 'utf8')).toContain('# NEWS_QUERY_BATCH=500')
    writeFileSync(join(copy.directory, 'explanations.ts'), 'export const explanations = {}\n')
    expect((await tunables(['--cwd', copy.directory, 'explain', '--check'])).code).toBe(1)
    expect((await tunables(['--cwd', copy.directory, 'explain'])).code).toBe(0)
    expect((await tunables(['--cwd', copy.directory, 'explain', '--check'])).code).toBe(0)
  })

  it('drafts the facts the model lacks, for /pdd-ideate, without writing the model', async () => {
    const copy = fixtureCopy()
    cleanup.push(copy.remove)
    const entity = join(copy.directory, 'product-model/entities/reader-limits.md')
    const before = readFileSync(entity, 'utf8').replace(/^- \*\*Site checks an hour\*\*.*\n/m, '')
    writeFileSync(entity, before)
    const result = await tunables(['--cwd', copy.directory, 'model', 'draft'])
    expect(result.stdout).toContain('- **Site checks an hour** —')
    expect(result.stdout).toContain('/pdd-ideate')
    expect(readFileSync(entity, 'utf8')).toBe(before)
  })
})

describe('database commands', () => {
  it('ask for connect when the config has none', async () => {
    const copy = fixtureCopy()
    cleanup.push(copy.remove)
    const config = join(copy.directory, 'tunables.config.ts')
    writeFileSync(config, readFileSync(config, 'utf8').replace('async connect() {', 'async notConnect() {'))
    const result = await tunables(['--cwd', copy.directory, 'sync'])
    expect(result.code).toBe(2)
    expect(result.stderr).toContain('add `connect` to tunables.config.ts')
  })
})

describe('install', () => {
  it('puts the three skills in each harness with an ownership marker', async () => {
    const project = mkdtempSync(join(tmpdir(), 'tunables-install-'))
    cleanup.push(() => rmSync(project, { recursive: true, force: true }))
    const result = await tunables(['install', '--providers', 'claude,codex', '--scope', 'project', '--yes'], { cwd: project })
    expect(result.code).toBe(0)
    for (const root of ['.claude/skills', '.agents/skills']) {
      const marker = JSON.parse(readFileSync(join(project, root, '.tunables-install.json'), 'utf8'))
      expect(marker).toMatchObject({ package: 'tunables', skills: ['tunables-adopt', 'tunables-define', 'tunables-verify'] })
      for (const skill of marker.skills) expect(existsSync(join(project, root, skill, 'SKILL.md'))).toBe(true)
    }
    expect((await tunables(['update'], { cwd: project })).code).toBe(0)
  })
})
