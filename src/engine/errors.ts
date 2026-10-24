import type { Problem } from '../model/definitions.js'

export class TunablesError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TunablesError'
  }
}

/** A group's values are not stored yet, or lack a field: `sync` has not run since it was declared. */
export class TunablesMissing extends TunablesError {
  constructor(readonly group: string, readonly keys: readonly string[]) {
    super(keys.length
      ? `The ${group} settings lack ${keys.join(', ')}. Run \`tunables sync\` to add them with their defaults.`
      : `The ${group} settings are not stored yet. Run \`tunables sync\` to seed them with their defaults.`)
    this.name = 'TunablesMissing'
  }
}

/** Stored values that no longer pass their checks. */
export class TunablesInvalid extends TunablesError {
  constructor(readonly group: string, readonly problems: readonly Problem[]) {
    super(`The stored ${group} settings do not hold: ${problems.map(problem => problem.message).join(' ')} Correct them with \`tunables set ${group} key=value\`, or restore an earlier revision.`)
    this.name = 'TunablesInvalid'
  }
}

/** A name the definitions do not declare: a programming error, not a person's. */
export class TunablesUnknown extends TunablesError {
  constructor(kind: string, id: string) {
    super(`No ${kind} "${id}" is defined.`)
    this.name = 'TunablesUnknown'
  }
}
