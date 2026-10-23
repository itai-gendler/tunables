#!/usr/bin/env node
// Runs as the `version` hook: the plugin manifest carries the package's version.
import { readFile, writeFile } from 'node:fs/promises'

const packageFile = new URL('../package.json', import.meta.url)
const pluginFile = new URL('../.claude-plugin/plugin.json', import.meta.url)

const pkg = JSON.parse(await readFile(packageFile, 'utf8'))
const plugin = JSON.parse(await readFile(pluginFile, 'utf8'))
if (typeof pkg.version !== 'string' || !pkg.version) throw new Error('package.json does not contain a valid version')

plugin.version = pkg.version
await writeFile(pluginFile, `${JSON.stringify(plugin, null, 2)}\n`)
console.log(`Synchronized the plugin version to ${pkg.version}.`)
