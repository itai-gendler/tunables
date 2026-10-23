#!/usr/bin/env node
/**
 * Typecheck a Nuxt host that extends `tunables/nuxt` from the packed package:
 * the layer's components, its plugin and `tunables/vue` resolve and typecheck
 * the way an installed app sees them.
 *
 * It packs without lifecycle scripts, so run it after `pnpm build`, or pass the
 * tarball Publish already packed. The fixture's own dependencies are installed
 * from the registry into a temporary copy; nothing is written inside the
 * repository.
 *
 * Usage: pnpm check:consumer [tarball]
 */
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixture = resolve(root, 'test/fixtures/nuxt-layer-consumer')
const work = mkdtempSync(join(tmpdir(), 'tunables-nuxt-consumer-'))
const quiet = ['--no-audit', '--no-fund', '--loglevel=error']
const run = (args, cwd) => execFileSync('npm', args, { cwd, stdio: 'inherit' })

// The fixture has no lockfile, so it resolves the newest versions, and a
// version the registry lists minutes before its tarball is served fails the
// install (ETARGET). A required check must not go red for that, so the
// registry install gets three tries, a minute apart.
function installFromRegistry(cwd) {
  for (let attempt = 1; ; attempt++) {
    try {
      return run(['install', '--ignore-scripts', ...quiet], cwd)
    } catch (error) {
      if (attempt === 3) throw error
      console.warn(`npm install failed (attempt ${attempt} of 3); retrying in 60s.`)
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 60_000)
    }
  }
}

try {
  if (!process.argv[2]) run(['pack', '--ignore-scripts', '--pack-destination', work, ...quiet], root)
  const tarball = process.argv[2] ? resolve(process.argv[2]) : join(work, readdirSync(work).find(name => name.endsWith('.tgz')))
  const app = join(work, 'app')
  cpSync(fixture, app, { recursive: true })
  installFromRegistry(app)
  run(['install', '--ignore-scripts', '--no-save', ...quiet, tarball], app)
  run(['run', 'prepare:nuxt'], app)
  run(['run', 'typecheck'], app)
  console.log('The Nuxt layer consumer fixture typechecks against this checkout.')
} finally {
  rmSync(work, { recursive: true, force: true })
}
