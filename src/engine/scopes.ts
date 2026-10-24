import type { Field } from '../model/kinds.js'
import { TunablesError } from './errors.js'

/**
 * Scopes: the places in an app a setting can take its own value, such as a
 * workspace and a user inside it. spec/scopes.md is the contract.
 */

/** Where in the chain a read or a change is: `{ workspace: 'w1', user: 'u7' }`. */
export type ScopePath = Readonly<Record<string, string>>

export type OverrideRule = 'free' | 'at-most' | 'at-least'

/** A path in chain order, broadest first. */
export type ScopeEntries = readonly (readonly [scope: string, id: string])[]

const ID = /^[^=;]+$/

/** A path's entries in chain order. Refuses a scope not in the chain, or one named without the scopes above it. */
export function scopeEntries(chain: readonly string[], path: ScopePath | undefined): ScopeEntries {
  if (!path) return []
  const names = Object.keys(path)
  for (const name of names) {
    if (!chain.includes(name)) throw new TunablesError(`"${name}" is not a scope. The scopes are: ${chain.join(', ') || 'none'}.`)
    const id = path[name]
    if (typeof id !== 'string' || !ID.test(id)) throw new TunablesError(`The ${name} id "${String(id)}" may not be empty or hold "=" or ";".`)
  }
  const entries = chain.slice(0, names.length).map(name => [name, path[name]] as const)
  const missing = entries.find(([, id]) => id === undefined)
  if (missing) throw new TunablesError(`A path naming ${names.join(' and ')} must name ${missing[0]} too: scopes are read broadest first (${chain.join(' → ')}).`)
  return entries as ScopeEntries
}

/** The stored key of a path: `workspace=w1;user=u7`, or `''` for the system. */
export function scopeKey(entries: ScopeEntries): string {
  return entries.map(([scope, id]) => `${scope}=${id}`).join(';')
}

export function parseScopeKey(key: string): ScopeEntries {
  if (!key) return []
  return key.split(';').map((part) => {
    const at = part.indexOf('=')
    return [part.slice(0, at), part.slice(at + 1)] as const
  })
}

export function pathOf(entries: ScopeEntries): Record<string, string> {
  return Object.fromEntries(entries)
}

/** How a field may be overridden at a scope, or undefined when it may not be. */
export function overrideRule(field: Field, scope: string): OverrideRule | undefined {
  const override = field.override
  if (!override) return undefined
  if (Array.isArray(override)) return override.includes(scope) ? 'free' : undefined
  return (override as Readonly<Record<string, OverrideRule>>)[scope]
}

/** Every scope a field may be overridden at, with how. */
export function overrideRules(field: Field): Record<string, OverrideRule> {
  const override = field.override
  if (!override) return {}
  if (Array.isArray(override)) return Object.fromEntries(override.map(scope => [scope, 'free' as const]))
  return { ...(override as Readonly<Record<string, OverrideRule>>) }
}

/** "Workspace w1": how a scope reads to a person when the app names it no other way. */
export function defaultScopeLabel(scope: string, id: string): string {
  return `${scope.charAt(0).toUpperCase()}${scope.slice(1)} ${id}`
}
