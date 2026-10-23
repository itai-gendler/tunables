import { writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { renderEnvExample } from '../model/environment.js'
import { UsageError } from '../core/usage-error.js'
import { configAt, readText, type ConfigOptions } from './shared.js'

/** Write `.env.example` from the deployment values; with `--check`, only say whether it is current. */
export async function runEnv(cwd: string, options: ConfigOptions & { check?: boolean } = {}): Promise<number> {
  const { config } = await configAt(cwd, options)
  if (!config.environment) throw new UsageError('tunables.config.ts declares no `environment`.')
  const file = resolve(cwd, config.envExample ?? '.env.example')
  const rendered = renderEnvExample(config.environment, config.envHeader)
  if (options.check) {
    const current = await readText(file) === rendered
    console.log(current ? `${relative(cwd, file)} is up to date.` : `${relative(cwd, file)} is out of date. Run \`tunables env\`.`)
    return current ? 0 : 1
  }
  await writeFile(file, rendered)
  console.log(`Wrote ${relative(cwd, file)}: ${Object.keys(config.environment.definitions).length} deployment values.`)
  return 0
}
