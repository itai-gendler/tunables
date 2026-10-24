#!/usr/bin/env node
import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { Command, CommanderError, Help, InvalidArgumentError } from 'commander'
import { runCheck } from './commands/check.js'
import { runEnv } from './commands/env.js'
import { runExplain } from './commands/explain.js'
import { runInstall } from './commands/install.js'
import { runModelDraft } from './commands/model.js'
import { runUpdate } from './commands/update.js'
import { runGet, runHistory, runRestore, runSet, runSync } from './commands/values.js'
import { ConfigError } from './config.js'
import { checkForCliUpdate } from './core/cli-update.js'
import { TunablesUnknown } from './engine/tunables.js'
import { UsageError } from './core/usage-error.js'
import { cliVersion } from './version.js'

interface InstallCliOptions {
  providers?: string
  scope?: string
  yes?: boolean
  force?: boolean
}

interface ConfigCliOptions {
  config?: string
}

/** Ends the invocation before its command runs, with this exit code. */
class StopInvocation extends Error {
  constructor(readonly exitCode: number) {
    super()
  }
}

function cwdFor(command: Command): string {
  const { cwd } = command.optsWithGlobals() as { cwd?: string }
  const directory = resolve(process.cwd(), cwd || '.')
  if (cwd !== undefined && !isDirectory(directory)) {
    throw new UsageError(`${directory} ${existsSync(directory) ? 'is not a directory' : 'does not exist'}. Pass an existing directory to --cwd.`)
  }
  return directory
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

function scope(value: string): 'project' | 'global' {
  const normalized = value.trim().toLowerCase()
  if (normalized !== 'project' && normalized !== 'global') {
    throw new InvalidArgumentError('expected "project" or "global"')
  }
  return normalized
}

function commandsBeforeOptions(output: string): string {
  const trailingNewline = output.endsWith('\n') ? '\n' : ''
  const sections = output.trimEnd().split(/\n{2,}/)
  const commands = sections.findIndex(section => section.startsWith('Commands:'))
  const options = sections.findIndex(section => section.startsWith('Options:'))
  if (commands < 0 || options < 0 || commands < options) return output

  const [commandSection] = sections.splice(commands, 1)
  sections.splice(options, 0, commandSection!)
  return sections.join('\n\n') + trailingNewline
}

function positiveInteger(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) throw new InvalidArgumentError('expected a positive whole number')
  return Number(value)
}

function configOf(command: Command): ConfigCliOptions {
  return { config: (command.optsWithGlobals() as ConfigCliOptions).config }
}

function createProgram(setExitCode: (code: number) => void): Command {
  const program = new Command()
    .name('tunables')
    .description('Runtime settings with guardrails, for the app you already run')
    .usage('<command> [options]')
    .option('-c, --cwd <path>', 'Run from another directory')
    .option('--config <file>', 'Use this tunables config instead of tunables.config.ts')
    .version(cliVersion(), '-V, --version', 'Show the CLI version')
    .helpOption('-h, --help', 'Show help for command')
    .helpCommand('help [command]', 'Show help for command')
    .showSuggestionAfterError()
    .configureHelp({
      showGlobalOptions: true,
      formatHelp(command, helper) {
        const output = Help.prototype.formatHelp.call(helper, command, helper)
        return command.parent ? output : commandsBeforeOptions(output)
      }
    })
    .exitOverride()
    .hook('preAction', async () => {
      const exitCode = await checkForCliUpdate()
      if (exitCode !== undefined) throw new StopInvocation(exitCode)
    })

  program
    .command('check')
    .summary('Check definitions, .env.example and the Product Model')
    .description('Check, without a database, that the definitions are sound, .env.example lists every deployment value, and the explanations and defaults agree with the Product Model.')
    .option('--json', 'Write the result as JSON')
    .action(async (options: { json?: boolean }, command: Command) => {
      setExitCode(await runCheck(cwdFor(command), { ...configOf(command), ...options }))
    })

  program
    .command('env')
    .summary('Write .env.example from the deployment values')
    .description('Write .env.example from the deployment values, each under its description at its default.')
    .option('--check', 'Only say whether .env.example is up to date')
    .action(async (options: { check?: boolean }, command: Command) => {
      setExitCode(await runEnv(cwdFor(command), { ...configOf(command), ...options }))
    })

  program
    .command('explain')
    .summary('Generate field explanations from the Product Model')
    .description('Write the explanations module from product-model/entities, so each field explains itself in the model\'s words.')
    .option('--check', 'Only say whether the explanations are up to date')
    .action(async (options: { check?: boolean }, command: Command) => {
      setExitCode(await runExplain(cwdFor(command), { ...configOf(command), ...options }))
    })

  const model = program
    .command('model')
    .summary('Work with the Product Model')
    .description('Work with the pdd-kit Product Model the fields name.')
    .usage('<command> [options]')
    .helpOption('-h, --help', 'Show help for command')
    .argument('[command]')
    .action((unknown: string | undefined, _options: Record<string, never>, command: Command) => {
      if (unknown) command.error(`error: unknown command '${unknown}' for 'tunables model'`)
      command.outputHelp()
    })

  model
    .command('draft')
    .summary('Draft the facts the model lacks')
    .description('Draft the Product Model facts for fields it does not describe, as Markdown to bring to /pdd-ideate. It never writes the model.')
    .option('--out <file>', 'Write the draft to a file instead of printing it')
    .action(async (options: { out?: string }, command: Command) => {
      setExitCode(await runModelDraft(cwdFor(command), { ...configOf(command), ...options }))
    })

  program
    .command('sync')
    .summary('Seed new settings with their defaults')
    .description('Store new groups and settings with their defaults, create missing preset defaults and catalog seeds, and report stored settings no definition declares.')
    .action(async (_options: Record<string, never>, command: Command) => {
      setExitCode(await runSync(cwdFor(command), configOf(command)))
    })

  program
    .command('get <group> [key]')
    .summary('Print stored values')
    .description('Print a group\'s stored values, or one of them, with any that differ from their default.')
    .option('--json', 'Write the values as JSON')
    .option('--scope <path>', 'Read at a scope, as workspace=w1,user=u7')
    .option('--url <url>', 'Use the app\'s tunables API instead of tunables.config.ts (or TUNABLES_URL); TUNABLES_TOKEN is sent as a bearer token')
    .action(async (group: string, key: string | undefined, options: { json?: boolean, scope?: string, url?: string }, command: Command) => {
      setExitCode(await runGet(cwdFor(command), group, key, { ...configOf(command), ...options }))
    })

  program
    .command('set <group> [assignments...]')
    .summary('Change values, checked and recorded')
    .description('Change values as key=value (JSON for ranges and sizes), through the same checks as the screens, recorded with you and a reason.')
    .requiredOption('--reason <text>', 'Why, kept in the history')
    .option('--yes', 'Confirm a change that asks to be confirmed')
    .option('--scope <path>', 'Set values for a scope, as workspace=w1,user=u7')
    .option('--inherit <keys>', 'At --scope, use the inherited value again for these comma-separated keys')
    .option('--url <url>', 'Use the app\'s tunables API instead of tunables.config.ts (or TUNABLES_URL); TUNABLES_TOKEN is sent as a bearer token')
    .action(async (group: string, assignments: string[], options: { reason?: string, yes?: boolean, scope?: string, inherit?: string, url?: string }, command: Command) => {
      setExitCode(await runSet(cwdFor(command), group, assignments, { ...configOf(command), ...options }))
    })

  program
    .command('history <group>')
    .summary('Show a group\'s revisions')
    .description('Show a group\'s revisions, newest first: who, when, why, and each value before and after.')
    .option('--limit <count>', 'How many revisions to show', positiveInteger)
    .option('--json', 'Write the revisions as JSON')
    .option('--scope <path>', 'Show a scope\'s revisions, as workspace=w1,user=u7')
    .option('--url <url>', 'Use the app\'s tunables API instead of tunables.config.ts (or TUNABLES_URL); TUNABLES_TOKEN is sent as a bearer token')
    .action(async (group: string, options: { limit?: number, json?: boolean, scope?: string, url?: string }, command: Command) => {
      setExitCode(await runHistory(cwdFor(command), group, { ...configOf(command), ...options }))
    })

  program
    .command('restore <revision>')
    .summary('Restore a group to an earlier revision')
    .description('Put a group back as it was after an earlier revision, through the same checks as any save.')
    .requiredOption('--reason <text>', 'Why, kept in the history')
    .option('--yes', 'Confirm a restore that asks to be confirmed')
    .option('--url <url>', 'Use the app\'s tunables API instead of tunables.config.ts (or TUNABLES_URL); TUNABLES_TOKEN is sent as a bearer token')
    .action(async (revision: string, options: { reason?: string, yes?: boolean, url?: string }, command: Command) => {
      setExitCode(await runRestore(cwdFor(command), revision, { ...configOf(command), ...options }))
    })

  program
    .command('install')
    .summary('Install tunables\' agent skills')
    .description('Install the tunables-adopt, tunables-define and tunables-verify skills for detected AI harnesses.')
    .option('--providers <list>', 'Comma-separated providers: claude,codex,cursor,gemini,github')
    .option('--scope <scope>', 'Installation scope: project or global', scope)
    .option('--yes', 'Accept detected providers and project scope')
    .option('--force', 'Replace an unmarked colliding tunables skill directory')
    .action(async (options: InstallCliOptions, command: Command) => {
      setExitCode(await runInstall(cwdFor(command), options))
    })

  program
    .command('update')
    .summary('Update installed skills')
    .description('Update tunables-managed skill installations to this version.')
    .option('--providers <list>', 'Limit discovery to: claude,codex,cursor,gemini,github')
    .option('--scope <scope>', 'Installation scope: project or global', scope)
    .option('--force', 'Replace an unmarked collision inside a managed installation')
    .action(async (options: InstallCliOptions, command: Command) => {
      setExitCode(await runUpdate(cwdFor(command), options))
    })

  return program
}

async function main(argv = process.argv): Promise<number> {
  let exitCode = 0
  const program = createProgram(code => { exitCode = code })

  if (argv.length === 2) {
    program.outputHelp()
    return 0
  }

  try {
    await program.parseAsync(argv)
    return exitCode
  } catch (error) {
    if (error instanceof StopInvocation) return error.exitCode
    if (error instanceof CommanderError) {
      return error.exitCode === 0 || error.code === 'commander.help' ? 0 : 2
    }
    console.error(`error: ${(error as Error).message}`)
    return error instanceof UsageError || error instanceof ConfigError || error instanceof TunablesUnknown ? 2 : 1
  }
}

main().then((code) => {
  process.exitCode = code
}, (error) => {
  console.error(`error: ${(error as Error).message}`)
  process.exitCode = 1
})
