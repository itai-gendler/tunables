import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { AnyCatalog, AnyGroup, AnyPresets, Effects } from './model/definitions.js'
import type { DeploymentValue } from './model/environment.js'
import type { Unit } from './model/units.js'
import type { AnyTunables } from './engine/tunables.js'

/**
 * `tunables.config.ts`: what the CLI and the agent skills read. The definitions
 * are enough for `check`, `env`, `explain` and `model draft`; `connect` is only
 * called by the commands that read or change stored values.
 */
export interface TunablesConfig {
  groups: readonly AnyGroup[]
  presets?: readonly AnyPresets[]
  catalogs?: readonly AnyCatalog[]
  units?: Readonly<Record<string, Unit>>
  effects?: Effects
  /** The app's deployment values, from `defineEnvironment`. */
  environment?: { definitions: Record<string, DeploymentValue> }
  /** Where `.env.example` is. Defaults to ".env.example" when there is an environment. */
  envExample?: string
  /** Lines `.env.example` starts with. */
  envHeader?: string
  /** The pdd-kit Product Model. Defaults to "product-model" when it exists. */
  productModel?: string
  /** Where `tunables explain` writes the explanations module, such as "shared/tunables-explanations.ts". */
  explanations?: string
  /** What the explanations module imports its type from. Defaults to "tunables". */
  explanationsImport?: string
  /** The app's tunables over its own store, for `sync`, `get`, `set`, `history` and `restore`. */
  connect?: () => AnyTunables | Promise<AnyTunables>
  /** Close what `connect` opened, so the command can exit. */
  disconnect?: () => void | Promise<void>
}

export function defineConfig(config: TunablesConfig): TunablesConfig {
  return config
}

export const CONFIG_FILES = ['tunables.config.ts', 'tunables.config.mts', 'tunables.config.js', 'tunables.config.mjs']

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

/** Find and load the config from a directory, or from the file given. */
export async function loadConfig(cwd: string, file?: string): Promise<{ config: TunablesConfig, path: string }> {
  const path = file ? resolve(cwd, file) : CONFIG_FILES.map(name => join(cwd, name)).find(candidate => existsSync(candidate))
  if (!path || !existsSync(path)) {
    throw new ConfigError(file
      ? `${file} does not exist.`
      : `No tunables config here. Create tunables.config.ts exporting defineConfig({ groups, ... }) from 'tunables/config'.`)
  }
  const { createJiti } = await import('jiti')
  const jiti = createJiti(import.meta.url, { interopDefault: true, moduleCache: false })
  const loaded = await jiti.import<{ default?: TunablesConfig } | TunablesConfig>(path)
  const config = ('default' in (loaded as object) ? (loaded as { default: TunablesConfig }).default : loaded) as TunablesConfig
  if (!config || !Array.isArray(config.groups)) throw new ConfigError(`${path} must export defineConfig({ groups, ... }) as its default.`)
  return { config, path }
}
