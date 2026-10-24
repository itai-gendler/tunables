import type { Fields, ValuesOf } from './kinds.js'

/** Something wrong with a change, in words, naming the field it is about when there is one. */
export interface Problem {
  /** The field the problem is about. Absent when it is about the whole change. */
  key?: string
  message: string
}

/** A rule's answer: problems, or plain messages, or nothing. */
export type RuleResult = readonly (Problem | string)[] | undefined | void

export const toProblems = (result: RuleResult): Problem[] =>
  (result ?? []).map(item => typeof item === 'string' ? { message: item } : item)

/* ------------------------------------------------------------------ groups */

export interface GroupDefinition<Id extends string = string, F extends Fields = Fields> {
  type: 'group'
  id: Id
  title: string
  description?: string
  /** The Product Model Entity this group is; field facts are looked up there. */
  entity?: string
  /** Where the group is edited in the host app, for links from All settings. */
  place?: { label: string, href: string }
  fields: F
  /** Settings in this group that bound one another, checked on every save. */
  rules?(values: ValuesOf<F>): RuleResult
  /**
   * A change that has consequences: return what to confirm, and the change is
   * saved only when it is sent again confirmed.
   */
  confirm?(next: ValuesOf<F>, previous: ValuesOf<F>): string | undefined
}

export function defineGroup<const Id extends string, const F extends Fields>(
  definition: Omit<GroupDefinition<Id, F>, 'type'>
): GroupDefinition<Id, F> {
  return { type: 'group', ...definition }
}

/* ----------------------------------------------------------------- presets */

/** The settings a preset is bounded by, read as they would be after the change being checked. */
export interface SettingsView {
  get(group: string): Record<string, unknown>
}

/** The catalogs a preset may pick from, as they would be after the change being checked. */
export interface CatalogView {
  entry(catalog: string, id: string): CatalogEntry | undefined
}

export interface PresetsDefinition<Id extends string = string, F extends Fields = Fields, Slot extends string = string> {
  type: 'presets'
  id: Id
  /** The set, plural: "Run Configs". */
  title: string
  /** One of them: "Run Config". */
  singular: string
  description?: string
  entity?: string
  place?: { label: string, href: string }
  /** What a preset fills; each slot has exactly one default. */
  slots: readonly Slot[]
  fields: F
  /** Fields of one preset that bound one another, or must agree with a catalog entry. */
  rules?(values: ValuesOf<F>, catalogs: CatalogView): RuleResult
  /** How the settings bound a preset. Checked when a preset is saved and when a setting is lowered. */
  within?(values: ValuesOf<F>, settings: SettingsView): RuleResult
  /**
   * Makes the set a layer of a group, such as Plans of Limits: the preset a
   * subject of `scope` is assigned in `slot` (the first slot by default), or the
   * slot's default, sits between the system value and that scope's own. The
   * set's fields must be fields of the group, of the same kinds.
   */
  layer?: { group: string, scope: string, slot?: Slot }
  /** Presets `sync` creates when a slot has no default. Absent: one per slot, from the field defaults. */
  seed?: readonly { key: string, slot: Slot, label: string, values?: Partial<ValuesOf<F>> }[]
}

export function definePresets<const Id extends string, const F extends Fields, const Slot extends string>(
  definition: Omit<PresetsDefinition<Id, F, Slot>, 'type'>
): PresetsDefinition<Id, F, Slot> {
  return { type: 'presets', ...definition }
}

export interface Preset<V = Record<string, unknown>, Slot extends string = string> {
  key: string
  slot: Slot
  label: string
  isDefault: boolean
  values: V
  updatedAt: string | null
}

/* ---------------------------------------------------------------- catalogs */

export type CatalogState = 'available' | 'retired'

export interface CatalogEntry<V = Record<string, unknown>> {
  id: string
  state: CatalogState
  values: V
  createdAt: string | null
}

export interface CatalogDefinition<Id extends string = string, F extends Fields = Fields> {
  type: 'catalog'
  id: Id
  title: string
  singular: string
  description?: string
  entity?: string
  place?: { label: string, href: string }
  /** What an entry's id is called, such as "Provider id". */
  idLabel?: string
  fields: F
  /** The field that names an entry to a person. Defaults to its id. */
  labelField?: string
  rules?(values: ValuesOf<F>): RuleResult
  /** Entries `sync` adds when the catalog is empty. */
  seed?: readonly { id: string, values: ValuesOf<F> }[]
}

export function defineCatalog<const Id extends string, const F extends Fields>(
  definition: Omit<CatalogDefinition<Id, F>, 'type' | 'labelField'> & { labelField?: keyof F & string }
): CatalogDefinition<Id, F> {
  return { type: 'catalog', ...definition }
}

/* ----------------------------------------------------------------- effects */

export interface Effect {
  /** What changing the setting changes, in words. */
  label: string
  /** Shown with emphasis: a change here costs money or reaches people. */
  warn?: boolean
  /** An Iconify icon name, such as "i-lucide-coins". */
  icon?: string
}

export type Effects = Readonly<Record<string, Effect>>

export function defineEffects<const E extends Effects>(effects: E): E {
  return effects
}

/* ------------------------------------------------------------ the whole set */

export type AnyGroup = GroupDefinition<string, Fields>
export type AnyPresets = PresetsDefinition<string, Fields, string>
export type AnyCatalog = CatalogDefinition<string, Fields>

export type GroupValues<G> = G extends GroupDefinition<string, infer F> ? ValuesOf<F> : never
export type PresetValues<P> = P extends PresetsDefinition<string, infer F, string> ? ValuesOf<F> : never
export type PresetSlot<P> = P extends PresetsDefinition<string, Fields, infer S> ? S : never
export type CatalogValues<C> = C extends CatalogDefinition<string, infer F> ? ValuesOf<F> : never

/** The defaults a group's fields declare: the one home of each default. */
// Rule `a-default-lives-only-in-its-definition`.
export function defaultsOf<F extends Fields>(fields: F): ValuesOf<F> {
  return Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, structuredClone(field.default)])) as ValuesOf<F>
}
