import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { renderExplanations } from '../pdd/index.js'
import { UsageError } from '../core/usage-error.js'
import { configAt, modelFacts, readText, type ConfigOptions } from './shared.js'

/** Write the explanations module from the Product Model; with `--check`, only say whether it is current. */
export async function runExplain(cwd: string, options: ConfigOptions & { check?: boolean } = {}): Promise<number> {
  const { config } = await configAt(cwd, options)
  if (!config.explanations) throw new UsageError('tunables.config.ts names no `explanations` file to write.')
  const model = await modelFacts(cwd, config)
  if (!model) throw new UsageError(`There is no ${config.productModel ?? 'product-model'}/ here to explain fields from.`)
  const file = resolve(cwd, config.explanations)
  const rendered = renderExplanations(model, config.explanationsImport)
  if (options.check) {
    const current = await readText(file) === rendered
    console.log(current ? `${relative(cwd, file)} matches the Product Model.` : `${relative(cwd, file)} is out of date. Run \`tunables explain\`.`)
    return current ? 0 : 1
  }
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, rendered)
  const facts = Object.values(model).reduce((total, entity) => total + Object.keys(entity.facts).length, 0)
  console.log(`Wrote ${relative(cwd, file)}: ${facts} facts from ${Object.keys(model).length} Entities.`)
  return 0
}
