import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { userInfo } from 'node:os'
import { loadConfig, type TunablesConfig } from '../config.js'
import { createTunables } from '../engine/tunables.js'
import { memoryStore } from '../engine/memory-store.js'
import { readModelFacts } from '../pdd/index.js'
import type { AnyTunables } from '../engine/tunables.js'
import type { Explanations } from '../model/explanations.js'
import { UsageError } from '../core/usage-error.js'

export interface ConfigOptions {
  config?: string
}

export async function configAt(cwd: string, options: ConfigOptions) {
  return loadConfig(cwd, options.config)
}

export function modelDirectory(cwd: string, config: TunablesConfig): string | undefined {
  const directory = resolve(cwd, config.productModel ?? 'product-model')
  return existsSync(directory) ? directory : undefined
}

export async function modelFacts(cwd: string, config: TunablesConfig): Promise<Explanations | undefined> {
  const directory = modelDirectory(cwd, config)
  return directory ? readModelFacts(directory) : undefined
}

/** The definitions, checked, over a throwaway store: everything the checks need without a database. */
export function offline(config: TunablesConfig, explanations?: Explanations) {
  return createTunables({
    store: memoryStore(),
    groups: config.groups,
    presets: config.presets,
    catalogs: config.catalogs,
    units: config.units,
    effects: config.effects,
    explanations
  })
}

/** The app's tunables over its own store; closed when the work is done. */
export async function connected<T>(config: TunablesConfig, work: (tunables: AnyTunables) => Promise<T>): Promise<T> {
  if (!config.connect) throw new UsageError('This command reads stored values: add `connect` to tunables.config.ts, returning your app\'s tunables.')
  const tunables = await config.connect()
  try {
    return await work(tunables)
  } finally {
    await config.disconnect?.()
  }
}

/** Who a change from the terminal is recorded as. */
export function terminalActor(): string {
  try {
    return `${userInfo().username} (terminal)`
  } catch {
    return 'terminal'
  }
}

export async function readText(path: string): Promise<string | undefined> {
  return existsSync(path) ? readFile(path, 'utf8') : undefined
}

/** A value typed at a terminal: JSON when it parses, the text itself otherwise. */
export function parseValue(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}
