import { z } from 'zod'
import { formatAmount, type Unit } from './units.js'

/**
 * The kinds of setting. A field is declared once with its kind, its default and
 * how it reads; its check, its stored seed, the API's schema and its form input
 * all follow from that declaration.
 */

/** What every kind of field may say about itself. */
export interface FieldInfo {
  /** The name a person reads. Defaults to `fact`, then to the key. */
  label?: string
  /** The Product Model fact this field is. Its explanation comes from there. */
  fact?: string
  /** An explanation written here, for a field the Product Model does not describe. */
  help?: string
  /** The sub-heading the field is listed under within its group. */
  section?: string
  /** What changing the field changes, by effect id. */
  affects?: readonly string[]
}

export interface Choice {
  value: string
  label: string
}

export interface NumberField extends FieldInfo {
  kind: 'number'
  unit: string
  /** Only whole numbers. Defaults to true. */
  integer?: boolean
  /** Inclusive bounds beyond the unit's own. */
  min?: number
  max?: number
  default: number
}

export interface RangeField extends FieldInfo {
  kind: 'range'
  unit: string
  integer?: boolean
  default: { min: number, max: number }
}

export interface SizeField extends FieldInfo {
  kind: 'size'
  default: { width: number, height: number }
}

export interface ToggleField extends FieldInfo {
  kind: 'toggle'
  default: boolean
}

export interface ChoiceField<V extends string = string> extends FieldInfo {
  kind: 'choice'
  options: readonly Choice[]
  default: V
}

export interface ChoicesField<V extends string = string> extends FieldInfo {
  kind: 'choices'
  options: readonly Choice[]
  default: readonly V[]
  /** At least this many must be chosen. Defaults to 1. */
  minimum?: number
}

export interface TextField extends FieldInfo {
  kind: 'text'
  default: string
  /** The longest text allowed, in characters. */
  maxLength?: number
  /** Whether an empty text is allowed. Defaults to true. */
  optional?: boolean
  /** Shown as several lines. */
  multiline?: boolean
}

export interface PickField extends FieldInfo {
  kind: 'pick'
  /** The catalog whose Available entries may be picked. */
  catalog: string
  default: string
}

export type Field =
  | NumberField
  | RangeField
  | SizeField
  | ToggleField
  | ChoiceField
  | ChoicesField
  | TextField
  | PickField

export type Fields = Readonly<Record<string, Field>>

export type FieldValue<F> = F extends NumberField ? number
  : F extends RangeField ? { min: number, max: number }
    : F extends SizeField ? { width: number, height: number }
      : F extends ToggleField ? boolean
        : F extends ChoiceField<infer V> ? V
          : F extends ChoicesField<infer V> ? V[]
            : F extends TextField ? string
              : F extends PickField ? string
                : never

export type ValuesOf<F extends Fields> = { -readonly [K in keyof F]: FieldValue<F[K]> }

type Info = FieldInfo

const toChoices = (options: readonly (string | Choice)[]): Choice[] =>
  options.map(option => typeof option === 'string' ? { value: option, label: option } : option)

/* --------------------------------------------------------------- builders */

export function number(options: Info & { unit: string, default: number, integer?: boolean, min?: number, max?: number }): NumberField {
  return { kind: 'number', ...options }
}

export function range(options: Info & { unit: string, default: { min: number, max: number }, integer?: boolean }): RangeField {
  return { kind: 'range', ...options }
}

export function size(options: Info & { default: { width: number, height: number } }): SizeField {
  return { kind: 'size', ...options }
}

export function toggle(options: Info & { default: boolean }): ToggleField {
  return { kind: 'toggle', ...options }
}

export function choice<const V extends string>(options: Info & { options: readonly (V | { value: V, label: string })[], default: NoInfer<V> }): ChoiceField<V> {
  return { kind: 'choice', ...options, options: toChoices(options.options) }
}

export function choices<const V extends string>(options: Info & { options: readonly (V | { value: V, label: string })[], default: readonly NoInfer<V>[], minimum?: number }): ChoicesField<V> {
  return { kind: 'choices', ...options, options: toChoices(options.options) }
}

export function text(options: Info & { default: string, maxLength?: number, optional?: boolean, multiline?: boolean }): TextField {
  return { kind: 'text', ...options }
}

export function pick(options: Info & { catalog: string, default: string }): PickField {
  return { kind: 'pick', ...options }
}

/* --------------------------------------------------------------- reading */

/** The name a person reads for a field. */
export function fieldLabel(key: string, field: Field): string {
  return field.label ?? field.fact ?? key
}

/** How a field's value reads to a person, with its unit. */
export function formatValue(field: Field, value: unknown, unitOf: (id: string) => Unit | undefined): string {
  if (value === undefined || value === null) return '—'
  switch (field.kind) {
    case 'toggle': return value ? 'On' : 'Off'
    case 'choice': return field.options.find(option => option.value === value)?.label ?? String(value)
    case 'choices': return (value as string[]).map(item => field.options.find(option => option.value === item)?.label ?? item).join(', ') || 'None'
    case 'range': {
      const { min, max } = value as { min: number, max: number }
      const unit = unitOf(field.unit)
      return unit?.format ? `${unit.format(min)}–${unit.format(max)}` : `${min}–${max} ${unit?.label ?? ''}`.trim()
    }
    case 'size': {
      const { width, height } = value as { width: number, height: number }
      return `${width} × ${height} pixels`
    }
    case 'number': return formatAmount(Number(value), unitOf(field.unit))
    case 'text': return String(value) || '—'
    case 'pick': return String(value)
  }
}

/* --------------------------------------------------------------- checking */

function amount(label: string, unit: Unit | undefined, options: { integer?: boolean, min?: number, max?: number }) {
  const integer = options.integer ?? unit?.integer ?? true
  let schema = z.number({ error: `${label} must be a number.` })
  if (integer) schema = schema.int({ error: `${label} must be a whole number.` })
  const min = options.min ?? unit?.min
  const max = options.max ?? unit?.max
  schema = min === undefined
    ? schema.positive({ error: `${label} must be more than 0.` })
    : schema.min(min, { error: `${label} may not be less than ${formatAmount(min, unit)}.` })
  if (max !== undefined) schema = schema.max(max, { error: `${label} may not be more than ${formatAmount(max, unit)}.` })
  return schema
}

/** The check a field's value must pass, with problems in the field's own words. */
export function fieldSchema(key: string, field: Field, unitOf: (id: string) => Unit | undefined): z.ZodType {
  const label = fieldLabel(key, field)
  switch (field.kind) {
    case 'number': return amount(label, unitOf(field.unit), field)
    case 'range': {
      const unit = unitOf(field.unit)
      const bound = amount(label, unit, { integer: field.integer })
      return z.object({ min: bound, max: bound }, { error: `${label} must have a shortest and a longest.` }).strict()
        .refine(value => value.min <= value.max, { error: `${label}: the shortest may not be longer than the longest.` })
    }
    case 'size': {
      const side = amount(label, undefined, { integer: true })
      return z.object({ width: side, height: side }, { error: `${label} must have a width and a height.` }).strict()
    }
    case 'toggle': return z.boolean({ error: `${label} must be on or off.` })
    case 'choice': return z.enum(field.options.map(option => option.value) as [string, ...string[]], {
      error: `${label} must be one of: ${field.options.map(option => option.label).join(', ')}.`
    })
    case 'choices': {
      const values = field.options.map(option => option.value) as [string, ...string[]]
      const minimum = field.minimum ?? 1
      return z.array(z.enum(values, { error: `${label} may only hold: ${field.options.map(option => option.label).join(', ')}.` }))
        .min(minimum, { error: minimum === 1 ? `${label} needs at least one choice.` : `${label} needs at least ${minimum} choices.` })
        .refine(list => new Set(list).size === list.length, { error: `${label} lists a choice twice.` })
    }
    case 'text': {
      let schema = z.string({ error: `${label} must be text.` })
      if (field.maxLength !== undefined) schema = schema.max(field.maxLength, { error: `${label} may be at most ${field.maxLength} characters.` })
      if (field.optional === false) schema = schema.trim().min(1, { error: `${label} may not be empty.` })
      return schema
    }
    case 'pick': return z.string({ error: `${label} must name an entry of ${field.catalog}.` }).min(1, { error: `${label} must be chosen.` })
  }
}
