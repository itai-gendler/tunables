/**
 * Deployment values: what a deployment sets in its environment and nobody tunes
 * while the app runs, such as a lock id or a batch size. Each has a description
 * and, unless it must be set, a default, and `.env.example` lists them all.
 *
 * A value lives in the environment or in a group, never both.
 */

interface ValueInfo {
  description: string
  /** The `.env.example` section it is listed under. */
  section?: string
}

export interface IntegerValue extends ValueInfo { kind: 'integer', default?: number, min?: number, max?: number }
export interface NumberValue extends ValueInfo { kind: 'number', default?: number, min?: number, max?: number }
export interface StringValue extends ValueInfo { kind: 'string', default?: string }
export interface BooleanValue extends ValueInfo { kind: 'boolean', default?: boolean }
export interface ChoiceValue<V extends string = string> extends ValueInfo { kind: 'choice', options: readonly V[], default?: V }

export type DeploymentValue = IntegerValue | NumberValue | StringValue | BooleanValue | ChoiceValue

type ValueOf<D> = D extends IntegerValue | NumberValue ? number
  : D extends StringValue ? string
    : D extends BooleanValue ? boolean
      : D extends ChoiceValue<infer V> ? V
        : never

export type EnvironmentValues<E extends Record<string, DeploymentValue>> = { readonly [K in keyof E]: ValueOf<E[K]> }

export const env = {
  integer: (options: Omit<IntegerValue, 'kind'>): IntegerValue => ({ kind: 'integer', ...options }),
  number: (options: Omit<NumberValue, 'kind'>): NumberValue => ({ kind: 'number', ...options }),
  string: (options: Omit<StringValue, 'kind'>): StringValue => ({ kind: 'string', ...options }),
  boolean: (options: Omit<BooleanValue, 'kind'>): BooleanValue => ({ kind: 'boolean', ...options }),
  choice: <const V extends string>(options: Omit<ChoiceValue<V>, 'kind'>): ChoiceValue<V> => ({ kind: 'choice', ...options })
}

/** The environment did not hold: every value that is missing or malformed, by name. */
export class EnvironmentError extends Error {
  constructor(readonly problems: readonly { name: string, message: string }[]) {
    super(`The environment is not valid:\n${problems.map(problem => `- ${problem.name}: ${problem.message}`).join('\n')}`)
    this.name = 'EnvironmentError'
  }
}

type Env = Readonly<Record<string, string | undefined>>

function parseValue(definition: DeploymentValue, raw: string | undefined): { value?: unknown, problem?: string } {
  const text = raw?.trim()
  if (text === undefined || text === '') {
    if (definition.default !== undefined) return { value: definition.default }
    return { problem: 'is required and not set.' }
  }
  switch (definition.kind) {
    case 'integer':
    case 'number': {
      const value = Number(text)
      if (!Number.isFinite(value)) return { problem: `must be a number, not "${text}".` }
      if (definition.kind === 'integer' && !Number.isInteger(value)) return { problem: `must be a whole number, not "${text}".` }
      const min = definition.min ?? (definition.kind === 'integer' ? 1 : undefined)
      if (min !== undefined && value < min) return { problem: `may not be less than ${min}.` }
      if (definition.max !== undefined && value > definition.max) return { problem: `may not be more than ${definition.max}.` }
      if (definition.kind === 'number' && definition.min === undefined && value <= 0) return { problem: 'must be more than 0.' }
      return { value }
    }
    case 'boolean':
      if (/^(1|true|yes|on)$/i.test(text)) return { value: true }
      if (/^(0|false|no|off)$/i.test(text)) return { value: false }
      return { problem: `must be true or false, not "${text}".` }
    case 'choice':
      if ((definition.options as readonly string[]).includes(text)) return { value: text }
      return { problem: `must be one of ${definition.options.join(', ')}, not "${text}".` }
    case 'string':
      return { value: raw }
  }
}

export interface Environment<E extends Record<string, DeploymentValue>> {
  readonly definitions: E
  /** Every value, read and checked at once. Throws `EnvironmentError` naming each problem. */
  read(source?: Env): EnvironmentValues<E>
  /** One value. Throws `EnvironmentError` when it is missing or malformed. */
  get<K extends keyof E & string>(name: K, source?: Env): ValueOf<E[K]>
}

// Rule `a-value-has-one-home`: deployment values are read here and nowhere else.
export function defineEnvironment<const E extends Record<string, DeploymentValue>>(definitions: E): Environment<E> {
  return {
    definitions,
    read(source = process.env) {
      const values: Record<string, unknown> = {}
      const problems: { name: string, message: string }[] = []
      for (const [name, definition] of Object.entries(definitions)) {
        const parsed = parseValue(definition, source[name])
        if (parsed.problem) problems.push({ name, message: parsed.problem })
        else values[name] = parsed.value
      }
      if (problems.length) throw new EnvironmentError(problems)
      return values as EnvironmentValues<E>
    },
    get(name, source = process.env) {
      const definition = definitions[name]
      if (!definition) throw new EnvironmentError([{ name, message: 'is not a declared deployment value.' }])
      const parsed = parseValue(definition, source[name])
      if (parsed.problem) throw new EnvironmentError([{ name, message: parsed.problem }])
      return parsed.value as ValueOf<E[typeof name]>
    }
  }
}

/** `.env.example`, listing every deployment value under its description, commented out at its default. */
export function renderEnvExample(environment: { definitions: Record<string, DeploymentValue> }, header?: string): string {
  const lines: string[] = []
  if (header) lines.push(...header.trimEnd().split('\n').map(line => line ? `# ${line}` : '#'), '')
  let section: string | undefined
  for (const [name, definition] of Object.entries(environment.definitions)) {
    if (definition.section && definition.section !== section) {
      section = definition.section
      lines.push(`# --- ${section}`, '')
    }
    for (const line of definition.description.trim().split('\n')) lines.push(`# ${line}`)
    if (definition.kind === 'choice') lines.push(`# One of: ${definition.options.join(', ')}.`)
    lines.push(definition.default === undefined ? `${name}=` : `# ${name}=${String(definition.default)}`, '')
  }
  return `${lines.join('\n').trimEnd()}\n`
}
