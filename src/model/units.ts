/**
 * The units a number, range or size is measured in. Each says how a value reads
 * to a person and what values it may take, so `hour` (of the day) is 0–23 while
 * `minutes` is any positive amount.
 */
export interface Unit {
  /** Said after the amount: "minutes", "KB". Empty for a bare count. */
  label: string
  /** The smallest value allowed, inclusive. Absent means any positive amount. */
  min?: number
  /** The largest value allowed, inclusive. */
  max?: number
  /** Only whole numbers. */
  integer?: boolean
  /** A custom reading of an amount, such as "$2" or "06:00". */
  format?: (value: number) => string
}

export const BUILT_IN_UNITS = {
  count: { label: '' },
  seconds: { label: 'seconds' },
  minutes: { label: 'minutes' },
  hours: { label: 'hours' },
  days: { label: 'days' },
  characters: { label: 'characters' },
  words: { label: 'words' },
  tokens: { label: 'tokens' },
  kilobytes: { label: 'KB' },
  megabytes: { label: 'MB' },
  pixels: { label: 'pixels' },
  percent: { label: '%', min: 0, max: 100, format: value => `${value}%` },
  dollars: { label: 'dollars', format: value => `$${Number.isInteger(value) ? value : value.toFixed(2)}` },
  hour: { label: '', min: 0, max: 23, integer: true, format: value => `${String(value).padStart(2, '0')}:00` },
  weekday: { label: '', min: 0, max: 6, integer: true, format: value => WEEKDAYS[value] ?? String(value) }
} as const satisfies Record<string, Unit>

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export type BuiltInUnit = keyof typeof BUILT_IN_UNITS

/** How an amount in a unit reads to a person. */
export function formatAmount(value: number, unit: Unit | undefined): string {
  if (unit?.format) return unit.format(value)
  return `${value.toLocaleString('en-US')} ${unit?.label ?? ''}`.trim()
}
