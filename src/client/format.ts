import type { FieldDescription } from '../engine/describe.js'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function amount(field: FieldDescription, value: number): string {
  switch (field.unit?.id) {
    case 'dollars': return `$${Number.isInteger(value) ? value : value.toFixed(2)}`
    case 'hour': return `${String(value).padStart(2, '0')}:00`
    case 'weekday': return WEEKDAYS[value] ?? String(value)
    case 'percent': return `${value}%`
    default: return `${value.toLocaleString('en-US')} ${field.unit?.label ?? ''}`.trim()
  }
}

/**
 * How a value reads to a person, in the browser, from the field's description:
 * the same reading the server gives a stored value, for a value being edited.
 */
export function displayValue(field: FieldDescription, value: unknown, entryLabel?: (id: string) => string | undefined): string {
  if (value === undefined || value === null || value === '') return '—'
  switch (field.kind) {
    case 'toggle': return value ? 'On' : 'Off'
    case 'choice': return field.options?.find(option => option.value === value)?.label ?? String(value)
    case 'choices': return (value as string[]).map(item => field.options?.find(option => option.value === item)?.label ?? item).join(', ') || 'None'
    case 'range': {
      const { min, max } = value as { min: number, max: number }
      return field.unit && ['dollars', 'hour', 'weekday', 'percent'].includes(field.unit.id)
        ? `${amount(field, min)}–${amount(field, max)}`
        : `${min}–${max} ${field.unit?.label ?? ''}`.trim()
    }
    case 'size': {
      const { width, height } = value as { width: number, height: number }
      return `${width} × ${height} pixels`
    }
    case 'number': return amount(field, Number(value))
    case 'pick': return entryLabel?.(String(value)) ?? String(value)
    case 'text': return String(value)
  }
}
