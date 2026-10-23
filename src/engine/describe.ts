import { fieldLabel, formatValue, type Field, type Fields } from '../model/kinds.js'
import type { AnyCatalog, AnyGroup, AnyPresets, Effects } from '../model/definitions.js'
import { explain, type Explanations } from '../model/explanations.js'
import type { Unit } from '../model/units.js'

/**
 * What the screens need to know about the definitions, as plain JSON: every
 * field's kind, label, unit, explanation and default. The screens render from
 * this alone, so a host app never ships its definitions to the browser.
 */

export interface FieldDescription {
  key: string
  kind: Field['kind']
  label: string
  /** The Product Model fact the field is, when it names one. */
  fact?: string
  /** The field's explanation: its Product Model fact's, or its own where the model has none. */
  help?: string
  /** Whether the field carries help of its own. */
  ownHelp?: boolean
  section?: string
  affects: string[]
  unit?: { id: string, label: string }
  integer?: boolean
  min?: number
  max?: number
  options?: { value: string, label: string }[]
  minimum?: number
  maxLength?: number
  optional?: boolean
  multiline?: boolean
  catalog?: string
  default: unknown
  defaultDisplay: string
}

interface Described {
  id: string
  title: string
  description?: string
  entity?: string
  place?: { label: string, href: string }
  /** Section names in the order their first field appears. */
  sections: string[]
  fields: FieldDescription[]
}

export interface GroupDescription extends Described {
  type: 'group'
}

export interface PresetsDescription extends Described {
  type: 'presets'
  singular: string
  slots: string[]
}

export interface CatalogDescription extends Described {
  type: 'catalog'
  singular: string
  idLabel: string
  labelField?: string
}

export interface Description {
  groups: GroupDescription[]
  presets: PresetsDescription[]
  catalogs: CatalogDescription[]
  effects: Record<string, { label: string, warn: boolean, icon?: string }>
}

export function describeFields(fields: Fields, entity: string | undefined, explanations: Explanations | undefined, unitOf: (id: string) => Unit | undefined): FieldDescription[] {
  return Object.entries(fields).map(([key, field]) => {
    const described: FieldDescription = {
      key,
      kind: field.kind,
      label: fieldLabel(key, field),
      fact: field.fact,
      ownHelp: field.help !== undefined,
      // Rule `every-field-explains-itself`.
      // The Product Model's description wins; a field's own `help` is for what the model does not describe.
      help: explain(explanations, entity, field.fact)?.text ?? field.help,
      section: field.section,
      affects: [...(field.affects ?? [])],
      default: field.default,
      defaultDisplay: formatValue(field, field.default, unitOf)
    }
    if (field.kind === 'number' || field.kind === 'range') {
      const unit = unitOf(field.unit)
      described.unit = { id: field.unit, label: unit?.label ?? '' }
      described.integer = field.integer ?? unit?.integer ?? true
      described.min = (field.kind === 'number' ? field.min : undefined) ?? unit?.min
      described.max = (field.kind === 'number' ? field.max : undefined) ?? unit?.max
    }
    if (field.kind === 'size') described.unit = { id: 'pixels', label: 'pixels' }
    if (field.kind === 'choice' || field.kind === 'choices') described.options = field.options.map(option => ({ ...option }))
    if (field.kind === 'choices') described.minimum = field.minimum ?? 1
    if (field.kind === 'text') {
      described.maxLength = field.maxLength
      described.optional = field.optional ?? true
      described.multiline = field.multiline ?? false
    }
    if (field.kind === 'pick') described.catalog = field.catalog
    return described
  })
}

const sectionsOf = (fields: FieldDescription[]) => [...new Set(fields.map(field => field.section).filter((section): section is string => Boolean(section)))]

export function describe(
  definitions: { groups: readonly AnyGroup[], presets: readonly AnyPresets[], catalogs: readonly AnyCatalog[], effects: Effects },
  explanations: Explanations | undefined,
  unitOf: (id: string) => Unit | undefined
): Description {
  return {
    groups: definitions.groups.map((group) => {
      const fields = describeFields(group.fields, group.entity, explanations, unitOf)
      return { type: 'group', id: group.id, title: group.title, description: group.description, entity: group.entity, place: group.place, sections: sectionsOf(fields), fields }
    }),
    presets: definitions.presets.map((set) => {
      const fields = describeFields(set.fields, set.entity, explanations, unitOf)
      return { type: 'presets', id: set.id, title: set.title, singular: set.singular, description: set.description, entity: set.entity, place: set.place, slots: [...set.slots], sections: sectionsOf(fields), fields }
    }),
    catalogs: definitions.catalogs.map((catalog) => {
      const fields = describeFields(catalog.fields, catalog.entity, explanations, unitOf)
      return { type: 'catalog', id: catalog.id, title: catalog.title, singular: catalog.singular, description: catalog.description, entity: catalog.entity, place: catalog.place, idLabel: catalog.idLabel ?? 'Id', labelField: catalog.labelField, sections: sectionsOf(fields), fields }
    }),
    effects: Object.fromEntries(Object.entries(definitions.effects).map(([id, effect]) => [id, { label: effect.label, warn: Boolean(effect.warn), icon: effect.icon }]))
  }
}
