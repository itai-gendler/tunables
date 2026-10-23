#!/usr/bin/env node
/*
 * The repository's own consistency checks, run on every commit and in CI:
 * required files, one package manager, versions that agree, a well-formed
 * changelog, skills that match the plugin, docs frontmatter the site reads,
 * local links that resolve, and Business Rules cited in code that exist.
 */
import { readFile, readdir, access } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { changelogProblems } from './changelog.mjs'

const root = process.cwd()
const errors = []

async function exists(path) {
  try {
    await access(resolve(root, path))
    return true
  } catch {
    return false
  }
}

const REQUIRED = [
  'README.md', 'LICENSE', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.json',
  'CHANGELOG.md', 'SECURITY.md', 'CONTRIBUTING.md', 'AGENTS.md', 'CONTEXT.md',
  'src/cli.ts', 'src/index.ts', 'src/postgres/index.ts', 'src/server/index.ts', 'src/vue/index.ts',
  'spec/storage.md', 'spec/handlers.md',
  'layers/nuxt/tunables/nuxt.config.ts',
  'fixture/news.ts', 'playground/package.json', 'site/package.json',
  'product-model/product.md',
  '.claude-plugin/plugin.json', '.claude-plugin/marketplace.json'
]
for (const file of REQUIRED) {
  if (!await exists(file)) errors.push(`missing required file: ${file}`)
}

const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const workspace = parseYaml(await readFile(resolve(root, 'pnpm-workspace.yaml'), 'utf8'))
const plugin = JSON.parse(await readFile(resolve(root, '.claude-plugin/plugin.json'), 'utf8').catch(() => '{}'))
const marketplace = JSON.parse(await readFile(resolve(root, '.claude-plugin/marketplace.json'), 'utf8').catch(() => '{}'))
const expectedSkills = ['tunables-adopt', 'tunables-define', 'tunables-verify']

if (pkg.name !== 'tunables') errors.push(`package.json name must be tunables, found ${pkg.name}`)
if (pkg.bin?.tunables !== 'dist/cli.js') errors.push('package.json must install the tunables command')
if (pkg.repository?.url !== 'git+https://github.com/itai-gendler/tunables.git') {
  errors.push('package.json repository must be git+https://github.com/itai-gendler/tunables.git')
}
if (pkg.version !== plugin.version) {
  errors.push(`.claude-plugin/plugin.json version ${plugin.version} must match package.json ${pkg.version}; run \`pnpm version\``)
}
if (!/^pnpm@\d+\.\d+\.\d+(\+sha\d+\.[0-9a-f]+)?$/.test(pkg.packageManager ?? '')) {
  errors.push('package.json packageManager must pin an exact pnpm version')
}
if (await exists('package-lock.json') || await exists('npm-shrinkwrap.json') || await exists('yarn.lock')) {
  errors.push('pnpm is the only package manager: remove npm or yarn lockfiles')
}
if (pkg.workspaces || pkg.overrides) errors.push('package.json must not declare workspaces or overrides; pnpm-workspace.yaml does')
if (JSON.stringify(workspace?.packages) !== JSON.stringify(['playground', 'site'])) {
  errors.push('pnpm-workspace.yaml packages must be exactly playground and site')
}
for (const member of ['playground', 'site']) {
  const memberPackage = JSON.parse(await readFile(resolve(root, `${member}/package.json`), 'utf8').catch(() => '{}'))
  if (memberPackage.private !== true) errors.push(`${member}/package.json must stay private: it is never published`)
}
for (const required of ['CHANGELOG.md', 'dist', 'docs', 'layers', 'skills']) {
  if (!pkg.files?.includes(required)) errors.push(`package.json files must include "${required}"`)
}
// A CLI-only install must pull no framework: every framework is an optional peer.
for (const peer of Object.keys(pkg.peerDependencies ?? {})) {
  if (!pkg.peerDependenciesMeta?.[peer]?.optional) errors.push(`peer "${peer}" must be optional`)
  if (pkg.dependencies?.[peer]) errors.push(`"${peer}" is a peer; it must not also be a dependency`)
}

const changelog = await readFile(resolve(root, 'CHANGELOG.md'), 'utf8').catch(() => '')
if (pkg.version !== '0.0.0' && !changelog.includes(`## [${pkg.version}]`)) {
  errors.push(`CHANGELOG.md is missing a [${pkg.version}] release heading`)
}
for (const problem of changelogProblems(changelog)) errors.push(`CHANGELOG.md ${problem}`)

/* ------------------------------------------------------------------ skills */

if (plugin.repository !== 'https://github.com/itai-gendler/tunables') {
  errors.push('plugin.json repository must be https://github.com/itai-gendler/tunables')
}
if (!marketplace.plugins?.some(entry => entry.name === plugin.name)) {
  errors.push(`marketplace.json does not expose the "${plugin.name}" plugin`)
}
const configuredSkills = (plugin.skills || []).map(path => path.replace(/^\.\//, '').split('/').at(-1))
for (const skill of expectedSkills) {
  if (!configuredSkills.includes(skill)) errors.push(`plugin.json is missing skill "${skill}"`)
}
for (const skill of configuredSkills) {
  if (!expectedSkills.includes(skill)) errors.push(`plugin.json has unexpected skill "${skill}"`)
}
const installer = await readFile(resolve(root, 'src/core/skill-installation.ts'), 'utf8')
for (const skill of expectedSkills) {
  if (!installer.includes(`'${skill}'`)) errors.push(`src/core/skill-installation.ts does not install "${skill}"`)
}
const runner = await readFile(resolve(root, 'skills/tunables-define/scripts/run-tunables.mjs'), 'utf8').catch(() => null)
for (const skill of expectedSkills) {
  const dir = `skills/${skill}`
  const skillFile = `${dir}/SKILL.md`
  if (!await exists(skillFile)) {
    errors.push(`${skillFile} is missing`)
    continue
  }
  const source = await readFile(resolve(root, skillFile), 'utf8')
  const match = source.match(/^---\n([\s\S]*?)\n---/)
  if (!match) {
    errors.push(`${skillFile} is missing frontmatter`)
    continue
  }
  const keys = match[1].split('\n').filter(line => /^[a-z]+:/i.test(line)).map(line => line.split(':')[0])
  for (const key of keys) {
    if (!['name', 'description'].includes(key)) errors.push(`${skillFile} frontmatter has unexpected key "${key}"`)
  }
  const name = match[1].match(/^name:\s*(.+)$/m)?.[1]?.trim()
  if (name !== skill) errors.push(`${skillFile} frontmatter name "${name}" must be "${skill}"`)
  if (source.split('\n').length > 500) errors.push(`${skillFile} is over 500 lines; move detail into references/`)
  if (!await exists(`${dir}/agents/openai.yaml`)) errors.push(`${dir}/agents/openai.yaml is missing`)
  // Each installed skill must stand alone, so the runner is copied into each; keep the copies exact.
  const copy = await readFile(resolve(root, `${dir}/scripts/run-tunables.mjs`), 'utf8').catch(() => null)
  if (copy === null) errors.push(`${dir}/scripts/run-tunables.mjs is missing`)
  else if (runner !== null && copy !== runner) errors.push(`${dir}/scripts/run-tunables.mjs differs from skills/tunables-define/scripts/run-tunables.mjs`)
}

/* -------------------------------------------------------------------- docs */

// Docs frontmatter, consumed by the site's docs navigation:
// group = sidebar cluster, order = position across all docs.
const DOC_GROUPS = new Set(['Get started', 'Concepts', 'Integrate', 'Screens', 'CLI', 'Skills', 'Reference'])
const docFiles = (await readdir(resolve(root, 'docs')).catch(() => [])).filter(name => name.endsWith('.md')).sort()
const docOrders = new Map()
for (const name of docFiles) {
  const source = await readFile(resolve(root, `docs/${name}`), 'utf8')
  const match = source.match(/^---\n([\s\S]*?)\n---/)
  if (!match) {
    errors.push(`docs/${name} is missing frontmatter`)
    continue
  }
  const data = parseYaml(match[1])
  for (const key of ['title', 'description', 'group']) {
    if (typeof data?.[key] !== 'string' || !data[key].trim()) errors.push(`docs/${name} frontmatter is missing "${key}"`)
  }
  if (data?.group && !DOC_GROUPS.has(data.group)) errors.push(`docs/${name} group "${data.group}" must be one of: ${[...DOC_GROUPS].join(' | ')}`)
  if (!Number.isInteger(data?.order) || data.order < 1) errors.push(`docs/${name} order must be a positive integer`)
  else if (docOrders.has(data.order)) errors.push(`docs/${name} order ${data.order} duplicates docs/${docOrders.get(data.order)}`)
  else docOrders.set(data.order, name)
}
const orders = [...docOrders.keys()].sort((a, b) => a - b)
if (orders.some((order, index) => order !== index + 1)) errors.push(`docs orders must be contiguous from 1; found ${orders.join(', ')}`)

for (const file of ['README.md', 'AGENTS.md', 'CONTRIBUTING.md', ...docFiles.map(name => `docs/${name}`)]) {
  const source = await readFile(resolve(root, file), 'utf8').catch(() => '')
  for (const match of source.matchAll(/\[[^\]]*]\(([^)]+)\)/g)) {
    const href = match[1].trim().replace(/^<|>$/g, '').split(/\s+["']/)[0].split(/[?#]/)[0]
    if (!href || href.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(href)) continue
    if (!await exists(resolve(root, dirname(file), href))) {
      const line = source.slice(0, match.index).split('\n').length
      errors.push(`${file}:${line} links to missing local file "${href}"`)
    }
  }
}

/* ---------------------------------------------------- Business Rules in code */

// Code names the Business Rule it enforces as `rule \`slug\``; each must exist
// in the Product Model, so a renamed or removed rule cannot leave code behind.
async function* sourceFiles(directory) {
  for (const entry of await readdir(resolve(root, directory), { withFileTypes: true }).catch(() => [])) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      if (['node_modules', '.nuxt', '.output', 'dist'].includes(entry.name)) continue
      yield* sourceFiles(path)
    } else if (/\.(ts|vue|mjs)$/.test(entry.name)) {
      yield path
    }
  }
}
for (const directory of ['src', 'test', 'layers', 'fixture', 'playground']) {
  for await (const file of sourceFiles(directory)) {
    const source = await readFile(resolve(root, file), 'utf8')
    for (const match of source.matchAll(/[Rr]ules? ((?:`[a-z0-9]+(?:-[a-z0-9]+)*`(?:,? (?:and )?)?)+)/g)) {
      for (const [, slug] of match[1].matchAll(/`([a-z0-9-]+)`/g)) {
        if (!await exists(`product-model/business-rules/${slug}.md`)) {
          const line = source.slice(0, match.index).split('\n').length
          errors.push(`${file}:${line} cites Business Rule "${slug}", which product-model/business-rules does not hold`)
        }
      }
    }
  }
}

if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`)
  process.exit(1)
}
console.log('Repository checks passed.')
