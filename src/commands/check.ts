import { relative, resolve } from 'node:path'
import { renderEnvExample } from '../model/environment.js'
import { checkAgainstModel, renderExplanations } from '../pdd/index.js'
import { TunablesError } from '../engine/tunables.js'
import { configAt, modelFacts, offline, readText, type ConfigOptions } from './shared.js'

export interface CheckOptions extends ConfigOptions {
  json?: boolean
}

interface Finding {
  check: string
  message: string
}

/**
 * Everything that must hold without a database: the definitions are sound,
 * `.env.example` lists every deployment value, the explanations module is up to
 * date with the Product Model, and every field's fact and default agree with it.
 */
export async function runCheck(cwd: string, options: CheckOptions = {}): Promise<number> {
  const { config, path } = await configAt(cwd, options)
  const findings: Finding[] = []
  const passed: string[] = []
  const model = await modelFacts(cwd, config)

  let tunables
  try {
    tunables = offline(config, model)
    passed.push(`${config.groups.length} groups, ${config.presets?.length ?? 0} preset sets and ${config.catalogs?.length ?? 0} catalogs are defined soundly`)
  } catch (error) {
    if (!(error instanceof TunablesError)) throw error
    findings.push({ check: 'definitions', message: error.message })
  }

  // Nothing is compared against definitions that do not hold.
  if (!tunables) {
    report(options, cwd, path, passed, findings)
    return 1
  }

  if (config.environment) {
    const file = resolve(cwd, config.envExample ?? '.env.example')
    const expected = renderEnvExample(config.environment, config.envHeader)
    const actual = await readText(file)
    if (actual !== expected) findings.push({ check: 'environment', message: `${relative(cwd, file)} does not list the deployment values as declared. Run \`tunables env\`.` })
    else passed.push(`${relative(cwd, file)} lists all ${Object.keys(config.environment.definitions).length} deployment values`)
  }

  if (config.explanations) {
    const file = resolve(cwd, config.explanations)
    if (!model) findings.push({ check: 'explanations', message: `${relative(cwd, file)} is generated from the Product Model, but there is no product-model/ here.` })
    else if (await readText(file) !== renderExplanations(model, config.explanationsImport)) {
      findings.push({ check: 'explanations', message: `${relative(cwd, file)} is out of date with the Product Model. Run \`tunables explain\`.` })
    } else passed.push(`${relative(cwd, file)} matches the Product Model`)
  }

  if (model) {
    const problems = checkAgainstModel(tunables.describe(), model)
    for (const problem of problems) findings.push({ check: 'model', message: `${problem.at} ${problem.message}` })
    if (!problems.length) passed.push('every field\'s fact and default agree with the Product Model')
  }

  report(options, cwd, path, passed, findings)
  return findings.length ? 1 : 0
}

function report(options: CheckOptions, cwd: string, path: string, passed: string[], findings: Finding[]) {
  if (options.json) {
    console.log(JSON.stringify({ config: relative(cwd, path), passed, findings }, null, 2))
    return
  }
  for (const line of passed) console.log(`✓ ${line}`)
  for (const finding of findings) console.error(`✗ ${finding.check}: ${finding.message}`)
  console.log(findings.length ? `\n${findings.length} problem${findings.length === 1 ? '' : 's'}.` : '\ntunables check passed.')
}
