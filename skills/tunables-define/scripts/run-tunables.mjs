#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'

/** The npm package that installs the `tunables` command. */
const PACKAGE = 'tunables'

/** Read `file` as JSON, or `undefined` when it is absent or unreadable. */
function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return undefined
  }
}

/**
 * The CLI version these skills were installed from, or `undefined` when
 * nothing records it.
 *
 * The skills and the CLI are one release: a skill installed from version X
 * describes the commands, checks and config of version X. `tunables install`
 * writes `.tunables-install.json` beside the skill folders. A Claude plugin
 * installs the whole package instead, so the skill folder sits at
 * `<package>/skills/<name>/` and the package's own manifest names the release.
 */
function installedVersion() {
  const installation = readJson(new URL('../../.tunables-install.json', import.meta.url))
  if (installation?.package === PACKAGE && typeof installation.version === 'string') {
    return installation.version
  }
  const packageRoot = readJson(new URL('../../../package.json', import.meta.url))
  if (packageRoot?.name === PACKAGE && typeof packageRoot.version === 'string') {
    return packageRoot.version
  }
  return undefined
}

/**
 * The app's own tunables CLI, resolved from `root` the way the app's imports
 * resolve it, with its version. `undefined` when the app does not depend on
 * tunables or its CLI is not built.
 */
function localCli(root) {
  try {
    const require = createRequire(join(root, 'package.json'))
    const manifestPath = require.resolve(`${PACKAGE}/package.json`)
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.[PACKAGE]
    if (manifest.name !== PACKAGE || typeof bin !== 'string') return undefined
    const cli = join(dirname(manifestPath), bin)
    return existsSync(cli) ? { cli, version: manifest.version } : undefined
  } catch {
    return undefined
  }
}

/**
 * Run npm without a shell. Windows ships npm as a `.cmd` shim that Node
 * refuses to start without one, so run the npm bundled beside Node directly,
 * and fall back to the shim through `cmd.exe` with every argument quoted.
 */
function npmInvocation(npmArgs) {
  if (process.platform !== 'win32') return { file: 'npm', args: npmArgs, shell: false }
  const bundled = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
  if (existsSync(bundled)) {
    return { file: process.execPath, args: [bundled, ...npmArgs], shell: false }
  }
  return {
    file: 'npm.cmd',
    args: npmArgs.map(arg => `"${arg.replaceAll('"', '""')}"`),
    shell: true
  }
}

const NPM_MISSING = 'npm was not found on PATH. Install Node.js with npm ' +
  '(https://nodejs.org), or put npm on PATH, then run the command again.'

/**
 * Maintainers can explicitly activate one local tunables worktree through
 * `~/.local/bin/tunables-dev`. Resolve only that fixed development command;
 * ordinary installations keep the pinned CLI below.
 */
function activeDevelopmentCli(env) {
  const binDirectory = resolve(env.TUNABLES_DEV_BIN_DIR || join(homedir(), '.local', 'bin'))
  try {
    const cli = execFileSync(join(binDirectory, 'tunables-dev'), ['--dev-cli'], {
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
    if (!isAbsolute(cli) || !statSync(cli).isFile()) return undefined
    const manifest = JSON.parse(readFileSync(join(dirname(dirname(cli)), 'package.json'), 'utf8'))
    return manifest?.name === PACKAGE ? cli : undefined
  } catch {
    return undefined
  }
}

function fail(message) {
  process.stderr.write(`${message}\n`)
  process.exit(2)
}

const args = process.argv.slice(2)
const rootIndex = args.indexOf('--root')
if (rootIndex >= 0 && !args[rootIndex + 1]) {
  fail('Usage: run-tunables.mjs [--root <directory with tunables.config.ts>] <command> [options]')
}
const root = resolve(rootIndex >= 0 ? args[rootIndex + 1] : process.cwd())
if (!existsSync(root) || !statSync(root).isDirectory()) {
  fail(`${root} is not a directory. Pass the directory that holds tunables.config.ts to --root.`)
}
const commandArgs = args.filter((_, index) => rootIndex < 0 || (index !== rootIndex && index !== rootIndex + 1))
if (commandArgs.length === 0) {
  fail('Usage: run-tunables.mjs [--root <directory with tunables.config.ts>] <command> [options]')
}

const env = { ...process.env }
const pinned = installedVersion()
const local = localCli(root)

function runNode(cli) {
  execFileSync(process.execPath, [cli, '--cwd', root, ...commandArgs], { cwd: root, env, stdio: 'inherit' })
}

try {
  const developmentCli = activeDevelopmentCli(env)
  if (developmentCli) {
    runNode(developmentCli)
  } else if (local && (pinned === undefined || local.version === pinned)) {
    runNode(local.cli)
  } else {
    if (local) {
      process.stderr.write(
        `note: this app depends on ${PACKAGE} ${local.version}, but these skills were installed from ${pinned}; ` +
        `running ${PACKAGE}@${pinned}. Align them with \`npx ${PACKAGE}@${local.version} update\` or by upgrading the dependency.\n`
      )
    }
    const npm = npmInvocation([
      'exec',
      '--yes',
      '--ignore-scripts',
      `--package=${PACKAGE}@${pinned ?? 'latest'}`,
      '--',
      PACKAGE,
      '--cwd',
      root,
      ...commandArgs
    ])
    execFileSync(npm.file, npm.args, { cwd: root, env, shell: npm.shell, stdio: 'inherit' })
  }
} catch (error) {
  // cmd.exe reports an unknown command as exit status 9009.
  if (error?.code === 'ENOENT' || (process.platform === 'win32' && error?.status === 9009)) {
    process.stderr.write(`${NPM_MISSING}\n`)
    process.exitCode = 127
  } else {
    process.exitCode = typeof error.status === 'number' ? error.status : 1
  }
}
