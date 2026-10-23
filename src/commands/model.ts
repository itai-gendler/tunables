import { writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { draftFacts } from '../pdd/index.js'
import { configAt, modelFacts, offline, type ConfigOptions } from './shared.js'

/**
 * Draft the facts the Product Model lacks for the definitions, as Markdown to
 * bring to `/pdd-ideate`. Printed, or written to `--out`. It never writes the model.
 */
export async function runModelDraft(cwd: string, options: ConfigOptions & { out?: string } = {}): Promise<number> {
  const { config } = await configAt(cwd, options)
  const model = await modelFacts(cwd, config) ?? {}
  const draft = draftFacts(offline(config, model).describe(), model)
  if (!draft) {
    console.log('The Product Model already describes every field.')
    return 0
  }
  if (options.out) {
    const file = resolve(cwd, options.out)
    await writeFile(file, draft)
    console.log(`Wrote ${relative(cwd, file)}. Bring it to /pdd-ideate to decide and write the facts.`)
  } else {
    console.log(draft)
  }
  return 0
}
