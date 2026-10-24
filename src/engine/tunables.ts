import { fieldLabel, fieldSchema, formatValue, type Fields } from '../model/kinds.js'
import {
  defaultsOf,
  toProblems,
  type AnyCatalog,
  type AnyGroup,
  type AnyPresets,
  type CatalogEntry,
  type CatalogView,
  type Effects,
  type GroupValues,
  type Preset,
  type Problem,
  type RuleResult,
  type SettingsView
} from '../model/definitions.js'
import type { Explanations } from '../model/explanations.js'
import { BUILT_IN_UNITS, type Unit } from '../model/units.js'
import { describe, type Description } from './describe.js'
import type { Change, Revision, RevisionTarget, StoreSession, StoredGroup, StoredRecord, TunablesStore } from './store.js'
import { defaultScopeLabel, overrideRule, overrideRules, parseScopeKey, pathOf, scopeEntries, scopeKey, type OverrideRule, type ScopeEntries, type ScopePath } from './scopes.js'

export { TunablesError, TunablesMissing, TunablesInvalid, TunablesUnknown } from './errors.js'
import { TunablesError, TunablesMissing, TunablesInvalid, TunablesUnknown } from './errors.js'

/* ------------------------------------------------------------------- types */

/** Who made a change. Stored as their name when given, their id otherwise. */
export type Actor = string | { id: string, name?: string }

export interface ChangeOptions {
  actor?: Actor
  /** Why, in words, kept on the revision. */
  reason?: string
  /** Sent again after the change asked to be confirmed. */
  confirmed?: boolean
  /** Where the change is made: a scope path such as `{ workspace: 'w1' }`. Absent: the whole system. */
  scope?: ScopePath
  /** The host app's open transaction or context, handed to guards, notes and uses. */
  host?: unknown
}

/** What a change came to. Nothing is stored unless `saved` is true. */
export interface Outcome<T = undefined> {
  saved: boolean
  problems: Problem[]
  /** Set when the change needs confirming: send it again with `confirmed`. */
  confirm?: string
  /** The revision recorded. Absent when nothing changed. */
  revision?: Revision
  value?: T
}

/** How one field reads at a scope: what it inherits, from where, and whether this scope sets its own. */
export interface FieldLayer {
  /** The value it would have here without this scope's own. */
  inherited: unknown
  inheritedDisplay: string
  /** Where the inherited value comes from: `system`, `plan:<key>` or a scope key. */
  from: string
  /** Where it comes from, as a person reads it: "System", "Pro plan", "Workspace Acme". */
  fromLabel: string
  /** Whether this scope sets its own value. */
  overridden: boolean
  rule: OverrideRule
}

export interface GroupEntry<V = Record<string, unknown>> {
  group: string
  /** Where the entry is read: absent for the system. */
  scope?: { key: string, path: Record<string, string>, label: string }
  /** For a scoped entry: each field this scope may set, and how it reads here. */
  layers?: Record<string, FieldLayer>
  values: V
  defaults: V
  /** Fields whose value differs from their default. */
  changed: string[]
  display: { values: Record<string, string>, defaults: Record<string, string> }
  /** What a value means here and now, by field: "12 Feeds use this". */
  notes: Record<string, string[]>
  updatedAt: string | null
  updatedBy: string | null
}

export interface SyncReport {
  /** Groups stored for the first time. */
  seeded: string[]
  /** Fields added to a stored group with their defaults. */
  added: { group: string, key: string }[]
  /** Stored fields no definition declares any more. Kept, never dropped silently. */
  unknown: { group: string, key: string }[]
  /** Presets created where a slot had no default. */
  presets: { set: string, key: string, slot: string, isDefault: boolean }[]
  /** Catalog entries added to an empty catalog. */
  catalog: { catalog: string, id: string }[]
}

export interface GuardArgs {
  group: string
  /** Where the change is made: `{}` for the system. */
  scope: ScopePath
  next: Record<string, unknown>
  previous: Record<string, unknown>
  session: StoreSession
  host: unknown
}

/** A check of something the host app keeps that depends on a group, run on every save of it. */
export type Guard = (args: GuardArgs) => RuleResult | Promise<RuleResult>

export type NotesProvider = (args: { group: string, values: Record<string, unknown>, session: StoreSession, host: unknown }) =>
  Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>

/** Names of the things the host app keeps that use a catalog entry. */
export type UsesProvider = (args: { catalog: string, entry: string, session: StoreSession, host: unknown }) => string[] | Promise<string[]>

export interface TunablesOptions<G extends readonly AnyGroup[]> {
  store: TunablesStore
  groups: G
  presets?: readonly AnyPresets[]
  catalogs?: readonly AnyCatalog[]
  units?: Readonly<Record<string, Unit>>
  effects?: Effects
  explanations?: Explanations
  guards?: Readonly<Partial<Record<G[number]['id'], readonly Guard[]>>>
  notes?: Readonly<Partial<Record<G[number]['id'], NotesProvider>>>
  uses?: Readonly<Record<string, UsesProvider>>
  /** The chain of scopes a setting may be overridden at, broadest first, such as `['workspace', 'user']`. */
  scopes?: readonly string[]
  /** How a scope reads to a person in refusals and screens: `(scope, id) => 'Acme'`. */
  scopeLabel?: (scope: string, id: string) => string | Promise<string>
}

type GroupOf<G extends readonly AnyGroup[], Id> = Extract<G[number], { id: Id }>

/* ----------------------------------------------------------------- helpers */

const KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const presetCollection = (set: string) => `preset:${set}`
const catalogCollection = (catalog: string) => `catalog:${catalog}`

function actorName(actor: Actor | undefined): string | null {
  if (actor === undefined) return null
  return typeof actor === 'string' ? actor : (actor.name ?? actor.id)
}

function equal(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function diff(previous: Record<string, unknown>, next: Record<string, unknown>, keys: Iterable<string>): Change[] {
  const changes: Change[] = []
  for (const key of keys) {
    if (!equal(previous[key], next[key])) changes.push({ key, from: previous[key] ?? null, to: next[key] ?? null })
  }
  return changes
}

const refused = <T>(problems: Problem[]): Outcome<T> => ({ saved: false, problems })

/** A rule over values that may be partly invalid must not fail the save; it answers nothing then. */
function safely(rule: () => Problem[]): Problem[] {
  try {
    return rule()
  } catch {
    return []
  }
}

function prefixed(prefix: string, problems: Problem[]): Problem[] {
  return problems.map(problem => ({ message: `${prefix}: ${problem.message}` }))
}

/* ---------------------------------------------------------------- creation */

// Rule `boot-never-needs-the-database`: creating tunables connects to nothing.
export function createTunables<const G extends readonly AnyGroup[]>(options: TunablesOptions<G>) {
  const groups = new Map(options.groups.map(group => [group.id, group]))
  const presetSets = new Map((options.presets ?? []).map(set => [set.id, set]))
  const catalogs = new Map((options.catalogs ?? []).map(catalog => [catalog.id, catalog]))
  const units: Record<string, Unit> = { ...BUILT_IN_UNITS, ...options.units }
  const unitOf = (id: string): Unit | undefined => units[id]
  const effects = options.effects ?? {}
  const store = options.store
  const chain = [...(options.scopes ?? [])]
  const listeners = new Map<string, Set<(values: Record<string, unknown>) => void>>()
  const lastGood = new Map<string, Record<string, unknown>>()

  checkDefinitions()

  function checkDefinitions() {
    const ids = new Set<string>()
    for (const definition of [...groups.values(), ...presetSets.values(), ...catalogs.values()]) {
      if (ids.has(definition.id)) throw new TunablesError(`"${definition.id}" is defined twice.`)
      ids.add(definition.id)
      for (const [key, field] of Object.entries(definition.fields)) {
        if ((field.kind === 'number' || field.kind === 'range') && !unitOf(field.unit)) {
          throw new TunablesError(`${definition.id}.${key} is measured in "${field.unit}", which is not a unit. Add it to \`units\`.`)
        }
        if (field.kind === 'pick' && !catalogs.has(field.catalog)) {
          throw new TunablesError(`${definition.id}.${key} picks from "${field.catalog}", which is not a catalog.`)
        }
        for (const effect of field.affects ?? []) {
          if (!(effect in effects)) throw new TunablesError(`${definition.id}.${key} affects "${effect}", which is not an effect. Add it to \`effects\`.`)
        }
        // A group's defaults are stored as they are, and a preset starts from
        // them; a catalog entry is always given its values, so its defaults
        // need not pass on their own.
        if (definition.type === 'catalog' || field.kind === 'pick') continue
        const problem = fieldSchema(key, field, unitOf).safeParse(field.default)
        if (!problem.success) {
          throw new TunablesError(`${definition.id}.${key}'s default does not pass its own check: ${problem.error.issues[0]?.message}`)
        }
      }
    }
    for (const set of presetSets.values()) {
      if (set.slots.length === 0) throw new TunablesError(`${set.id} has no slots.`)
      if (!set.layer) continue
      const group = groups.get(set.layer.group)
      if (!group) throw new TunablesError(`${set.id} is a layer of "${set.layer.group}", which is not a group.`)
      if (!chain.includes(set.layer.scope)) throw new TunablesError(`${set.id} is a layer at "${set.layer.scope}", which is not a scope. Add it to \`scopes\`.`)
      if (set.layer.slot && !set.slots.includes(set.layer.slot)) throw new TunablesError(`${set.id}'s layer slot "${set.layer.slot}" is not one of its slots.`)
      for (const [key, field] of Object.entries(set.fields)) {
        if (group.fields[key]?.kind !== field.kind) throw new TunablesError(`${set.id}.${key} must be a ${field.kind} field of ${group.id} to be its layer.`)
      }
    }
    for (const group of groups.values()) {
      for (const [key, field] of Object.entries(group.fields)) {
        for (const [scope, rule] of Object.entries(overrideRules(field))) {
          if (!chain.includes(scope)) throw new TunablesError(`${group.id}.${key} may be overridden at "${scope}", which is not a scope. Add it to \`scopes\`.`)
          if (rule !== 'free' && field.kind !== 'number') throw new TunablesError(`${group.id}.${key} is ${rule} its inherited value, which only a number field can be.`)
        }
      }
    }
    // Seeds are stored as they are, so they must hold too. Rule `values-stay-within-their-kind`.
    const seedProblem = (where: string, fields: Fields, values: Record<string, unknown>) => {
      const unpicked = Object.fromEntries(Object.entries(fields).filter(([, field]) => field.kind !== 'pick'))
      const [problem] = checkFields(unpicked, values)
      if (problem) throw new TunablesError(`${where}'s seed does not hold: ${problem.message}`)
    }
    for (const set of presetSets.values()) {
      for (const seed of set.seed ?? []) {
        if (!set.slots.includes(seed.slot)) throw new TunablesError(`${set.id} seeds "${seed.key}" into "${seed.slot}", which is not one of its slots.`)
        seedProblem(`${set.id}.${seed.key}`, set.fields, { ...defaultsOf(set.fields), ...seed.values })
      }
    }
    for (const catalog of catalogs.values()) {
      for (const seed of catalog.seed ?? []) seedProblem(`${catalog.id}.${seed.id}`, catalog.fields, { ...defaultsOf(catalog.fields), ...seed.values })
    }
  }

  const groupOf = (id: string): AnyGroup => {
    const group = groups.get(id)
    if (!group) throw new TunablesUnknown('group', id)
    return group
  }
  const presetsOf = (id: string): AnyPresets => {
    const set = presetSets.get(id)
    if (!set) throw new TunablesUnknown('preset set', id)
    return set
  }
  const catalogOf = (id: string): AnyCatalog => {
    const catalog = catalogs.get(id)
    if (!catalog) throw new TunablesUnknown('catalog', id)
    return catalog
  }

  /* ------------------------------------------------------------ checking */

  function checkFields(fields: Fields, values: Record<string, unknown>): Problem[] {
    const problems: Problem[] = []
    for (const [key, field] of Object.entries(fields)) {
      const result = fieldSchema(key, field, unitOf).safeParse(values[key])
      if (!result.success) problems.push({ key, message: result.error.issues[0]?.message ?? `${fieldLabel(key, field)} is not valid.` })
    }
    return problems
  }

  /** Pick fields must name an entry of their catalog; a retired one only when it is unchanged. */
  async function checkPicks(session: StoreSession, fields: Fields, values: Record<string, unknown>, previous?: Record<string, unknown>): Promise<Problem[]> {
    const picks = Object.entries(fields).filter(([, field]) => field.kind === 'pick')
    if (!picks.length) return []
    const view = await catalogView(session)
    const problems: Problem[] = []
    for (const [key, field] of picks) {
      if (field.kind !== 'pick') continue
      const picked = view.entry(field.catalog, String(values[key]))
      const label = fieldLabel(key, field)
      const catalog = catalogOf(field.catalog)
      if (!picked) problems.push({ key, message: `${label}: "${String(values[key])}" is not in ${catalog.title}.` })
      else if (picked.state !== 'available' && !(previous && equal(previous[key], values[key]))) {
        problems.push({ key, message: `${label}: "${String(values[key])}" is retired; choose an Available ${catalog.singular.toLowerCase()}.` })
      }
    }
    return problems
  }

  function unknownKeys(fields: Fields, values: Record<string, unknown>): string[] {
    return Object.keys(values).filter(key => !(key in fields))
  }

  function display(fields: Fields, values: Record<string, unknown>): Record<string, string> {
    return Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, formatValue(field, values[key], unitOf)]))
  }

  /* --------------------------------------------------------- reading */

  async function readGroupValues(session: StoreSession, id: string): Promise<{ values: Record<string, unknown>, updatedAt: string | null, updatedBy: string | null }> {
    const group = groupOf(id)
    const [row] = await session.readGroups([id])
    // Rule `a-missing-value-is-never-guessed`.
    if (!row) throw new TunablesMissing(id, [])
    const missing = Object.keys(group.fields).filter(key => !(key in row.values))
    if (missing.length) throw new TunablesMissing(id, missing)
    const values = Object.fromEntries(Object.keys(group.fields).map(key => [key, row.values[key]]))
    const problems = checkFields(group.fields, values)
    if (problems.length) throw new TunablesInvalid(id, problems)
    return { values, updatedAt: row.updatedAt, updatedBy: row.updatedBy }
  }

  async function settingsView(session: StoreSession, override?: { group: string, values: Record<string, unknown> }): Promise<SettingsView> {
    const rows = await session.readGroups()
    const byId = new Map(rows.map(row => [row.id, row.values]))
    return {
      get(group) {
        if (override && override.group === group) return override.values
        const definition = groupOf(group)
        const stored = byId.get(group)
        return { ...defaultsOf(definition.fields), ...stored }
      }
    }
  }

  async function catalogView(session: StoreSession, override?: { catalog: string, entry: CatalogEntry }): Promise<CatalogView & { all(catalog: string): CatalogEntry[] }> {
    const cache = new Map<string, CatalogEntry[]>()
    for (const id of catalogs.keys()) cache.set(id, (await session.listRecords(catalogCollection(id))).map(toEntry))
    const all = (catalog: string) => {
      const entries = cache.get(catalog) ?? []
      if (override?.catalog !== catalog) return entries
      return [...entries.filter(entry => entry.id !== override.entry.id), override.entry]
    }
    return {
      all,
      entry: (catalog, id) => all(catalog).find(entry => entry.id === id)
    }
  }

  function toEntry(record: StoredRecord): CatalogEntry {
    return {
      id: record.id,
      state: record.data.state === 'retired' ? 'retired' : 'available',
      values: (record.data.values ?? {}) as Record<string, unknown>,
      createdAt: record.createdAt
    }
  }

  function toPreset(record: StoredRecord): Preset {
    return {
      key: record.id,
      slot: String(record.data.slot),
      label: String(record.data.label ?? record.id),
      isDefault: record.data.isDefault === true,
      values: (record.data.values ?? {}) as Record<string, unknown>,
      updatedAt: record.updatedAt
    }
  }

  async function listPresets(session: StoreSession, set: string): Promise<Preset[]> {
    const presets = (await session.listRecords(presetCollection(set))).map(toPreset)
    const slots = presetsOf(set).slots
    return presets.sort((a, b) => slots.indexOf(a.slot) - slots.indexOf(b.slot) || Number(b.isDefault) - Number(a.isDefault) || a.label.localeCompare(b.label))
  }

  /* ---------------------------------------------------------- layering */

  /** Changes a check reads as if they were already made. */
  interface Planned {
    /** A group's rows by scope key; `null` removes a row. */
    rows?: Map<string, Record<string, unknown> | null>
    /** A preset set's presets, all of them, as they would be. */
    presets?: Map<string, Preset[]>
    /** A preset set's assignments, all of them, as they would be. */
    assignments?: Map<string, { subject: string, slot: string, recordId: string }[]>
  }

  const layerOf = (groupId: string, scope: string) => [...presetSets.values()].find(set => set.layer?.group === groupId && set.layer.scope === scope)

  async function labelOf(scope: string, id: string): Promise<string> {
    return options.scopeLabel ? await options.scopeLabel(scope, id) : defaultScopeLabel(scope, id)
  }

  async function sourceLabel(source: string, plans: ReadonlyMap<string, string> = new Map()): Promise<string> {
    if (source === 'system') return 'System'
    if (source.startsWith('plan:')) {
      const [, set, key] = source.split(':')
      return `${plans.get(source) ?? key} ${presetSets.get(set!)?.singular.toLowerCase() ?? 'preset'}`
    }
    const entries = parseScopeKey(source)
    const [scope, id] = entries[entries.length - 1]!
    return labelOf(scope, id)
  }

  async function rowAt(session: StoreSession, groupId: string, key: string, planned?: Planned): Promise<Record<string, unknown> | undefined> {
    if (planned?.rows?.has(key)) return planned.rows.get(key) ?? undefined
    const [row] = await session.readGroups([groupId], key)
    return row?.values
  }

  async function layerPreset(session: StoreSession, set: AnyPresets, subject: string, planned?: Planned): Promise<Preset | undefined> {
    const slot = set.layer?.slot ?? set.slots[0]!
    const presets = planned?.presets?.get(set.id) ?? await listPresets(session, set.id)
    const assignments = planned?.assignments?.get(set.id) ?? await session.listAssignments(presetCollection(set.id), { subject })
    const assigned = assignments.find(item => item.subject === subject && item.slot === slot)
    return (assigned && presets.find(preset => preset.key === assigned.recordId)) ?? presets.find(preset => preset.slot === slot && preset.isDefault)
  }

  /**
   * A group's values read at a path, layer by layer: the system's, a plan's,
   * then each scope's own. Rule `a-value-is-read-through-its-layers`.
   */
  async function layered(session: StoreSession, groupId: string, entries: ScopeEntries, planned?: Planned) {
    const group = groupOf(groupId)
    const system = planned?.rows?.get('') ?? (await readGroupValues(session, groupId)).values
    let values: Record<string, unknown> = { ...system }
    let sources: Record<string, string> = Object.fromEntries(Object.keys(group.fields).map(key => [key, 'system']))
    let inherited = values
    let inheritedFrom = sources
    let own: Record<string, unknown> = {}
    const plans = new Map<string, string>()
    for (const [index, [scope, id]] of entries.entries()) {
      const set = layerOf(groupId, scope)
      if (set) {
        const preset = await layerPreset(session, set, id, planned)
        if (preset) {
          plans.set(`plan:${set.id}:${preset.key}`, preset.label)
          for (const key of Object.keys(set.fields)) {
            if (key in preset.values) {
              values = { ...values, [key]: preset.values[key] }
              sources = { ...sources, [key]: `plan:${set.id}:${preset.key}` }
            }
          }
        }
      }
      const key = scopeKey(entries.slice(0, index + 1))
      if (index === entries.length - 1) {
        inherited = values
        inheritedFrom = sources
      }
      const row = await rowAt(session, groupId, key, planned)
      if (!row) continue
      // A field no longer overridable at this scope reads as inherited; its stored value can only be cleared.
      const kept = Object.fromEntries(Object.entries(row).filter(([field]) => group.fields[field] && overrideRule(group.fields[field]!, scope)))
      values = { ...values, ...kept }
      sources = { ...sources, ...Object.fromEntries(Object.keys(kept).map(field => [field, key])) }
      if (index === entries.length - 1) own = kept
    }
    return { values, sources, inherited, inheritedFrom, own, plans }
  }

  /** A value outside its bound at a scope, in words, or nothing. Rule `an-override-stays-within-its-bound`. */
  function boundProblem(groupId: string, key: string, rule: OverrideRule | undefined, value: unknown, inherited: unknown, where: string): Problem | undefined {
    const field = groupOf(groupId).fields[key]!
    if (rule === 'at-most' && Number(value) > Number(inherited)) {
      return { key, message: `${fieldLabel(key, field)} may be at most ${formatValue(field, inherited, unitOf)} ${where}, the value it inherits.` }
    }
    if (rule === 'at-least' && Number(value) < Number(inherited)) {
      return { key, message: `${fieldLabel(key, field)} must be at least ${formatValue(field, inherited, unitOf)} ${where}, the value it inherits.` }
    }
    return undefined
  }

  /**
   * Every stored override of a group that a planned change would leave outside
   * its bound, named. Rule `a-broader-value-never-leaves-an-override-outside-its-bound`.
   */
  async function overridesOutside(session: StoreSession, groupId: string, planned: Planned, skip?: string): Promise<Problem[]> {
    const group = groupOf(groupId)
    const stored = await session.readScopes(groupId)
    const rows = new Map<string, Record<string, unknown>>(stored.map(row => [row.scope, row.values]))
    for (const [key, values] of planned.rows ?? []) {
      if (!key) continue
      if (values) rows.set(key, values)
      else rows.delete(key)
    }
    // A change to one scope's row reaches only the scopes under it; a system or plan change reaches all.
    const changed = [...(planned.rows?.keys() ?? [])]
    const under = changed.length === 1 && changed[0] ? `${changed[0]};` : ''
    const problems: Problem[] = []
    for (const [key, values] of rows) {
      if (key === skip || !key.startsWith(under)) continue
      const entries = parseScopeKey(key)
      const [scope, id] = entries[entries.length - 1]!
      const bounded = Object.entries(values).filter(([field]) => {
        const rule = group.fields[field] && overrideRule(group.fields[field]!, scope)
        return rule === 'at-most' || rule === 'at-least'
      })
      if (!bounded.length && !group.rules) continue
      const after = await layered(session, groupId, entries, planned)
      const who = await labelOf(scope, id)
      for (const [field, value] of bounded) {
        const definition = group.fields[field]!
        const rule = overrideRule(definition, scope)
        const outside = rule === 'at-most' ? Number(value) > Number(after.inherited[field]) : Number(value) < Number(after.inherited[field])
        if (outside) {
          problems.push({ message: `${who} keeps ${fieldLabel(field, definition)} at ${formatValue(definition, value, unitOf)}, ${rule === 'at-most' ? 'above' : 'below'} ${formatValue(definition, after.inherited[field], unitOf)}.` })
        }
      }
      if (group.rules && Object.keys(after.own).length) {
        // Rule `settings-that-bound-one-another-agree`: for every scope as it reads; only what this change breaks is refused.
        const rules = group.rules
        const now = (await layered(session, groupId, entries)).values
        const already = new Set(safely(() => toProblems(rules(now as never))).map(problem => problem.message))
        for (const problem of safely(() => toProblems(rules(after.values as never)))) {
          if (!already.has(problem.message)) problems.push({ message: `For ${who}: ${problem.message}` })
        }
      }
    }
    return problems
  }

  /** Groups whose layers a preset set's change reaches. */
  const layeredBy = (setId: string) => [...groups.values()].filter(group => presetSets.get(setId)?.layer?.group === group.id).map(group => group.id)

  async function presetChangeOutside(session: StoreSession, setId: string, planned: Planned): Promise<Problem[]> {
    const problems: Problem[] = []
    for (const groupId of layeredBy(setId)) problems.push(...await overridesOutside(session, groupId, planned))
    return problems
  }

  /** Presets that would fall outside the settings, named. */
  async function presetsOutside(session: StoreSession, view: SettingsView): Promise<Problem[]> {
    const problems: Problem[] = []
    for (const set of presetSets.values()) {
      if (!set.within) continue
      for (const preset of await listPresets(session, set.id)) {
        const values = { ...defaultsOf(set.fields), ...preset.values }
        problems.push(...prefixed(`${set.singular} "${preset.label}"`, toProblems(set.within(values as never, view))))
      }
    }
    return problems
  }

  /* ----------------------------------------------------- running changes */

  type Runner = <T>(work: (session: StoreSession) => Promise<T>) => Promise<T>

  function api(run: Runner, plain: StoreSession, scoped: boolean) {
    type Announce = (group: string, values: Record<string, unknown>) => void
    // Inside a host transaction tunables cannot know when it commits, so what a
    // change announces waits until the host calls `committed()`.
    const pending: [string, Record<string, unknown>][] = []
    function announceAll(announced: [string, Record<string, unknown>][]) {
      for (const [group, values] of announced) {
        // The same key `get` reads the system's values under.
        lastGood.set(`${group}\u0000`, values)
        for (const listener of listeners.get(group) ?? []) listener(values)
      }
    }
    /** Run `work` as one change; what it announces reaches listeners once it has committed. */
    async function commit<T>(work: (session: StoreSession, announce: Announce) => Promise<T>): Promise<T> {
      const announced: [string, Record<string, unknown>][] = []
      const result = await run(session => work(session, (group, values) => announced.push([group, values])))
      if (scoped) pending.push(...announced)
      else announceAll(announced)
      return result
    }
    /** Inside a host transaction: tell listeners about its changes once the host has committed it. */
    function committed() {
      announceAll(pending.splice(0))
    }

    /** A group's values: the system's, or as read at a scope path. */
    async function get<Id extends G[number]['id']>(id: Id, readOptions: { scope?: ScopePath, lastGood?: boolean } = {}): Promise<GroupValues<GroupOf<G, Id>>> {
      const entries = scopeEntries(chain, readOptions.scope)
      const cacheKey = `${id}\u0000${scopeKey(entries)}`
      try {
        const values = entries.length ? (await layered(plain, id, entries)).values : (await readGroupValues(plain, id)).values
        lastGood.set(cacheKey, values)
        return values as GroupValues<GroupOf<G, Id>>
      } catch (error) {
        const kept = lastGood.get(cacheKey)
        if (readOptions.lastGood && kept) return kept as GroupValues<GroupOf<G, Id>>
        throw error
      }
    }

    async function notesFor(id: string, values: Record<string, unknown>, host: unknown) {
      const provider = (options.notes as Record<string, NotesProvider | undefined> | undefined)?.[id]
      const raw = provider ? await provider({ group: id, values, session: plain, host }) : {}
      return Object.fromEntries(Object.entries(raw)
        .filter((pair): pair is [string, string | string[]] => pair[1] !== undefined)
        .map(([key, value]) => [key, Array.isArray(value) ? value : [value]]))
    }

    async function entry<Id extends G[number]['id']>(id: Id, entryOptions: { host?: unknown, scope?: ScopePath } = {}): Promise<GroupEntry<GroupValues<GroupOf<G, Id>>>> {
      const group = groupOf(id)
      const defaults = defaultsOf(group.fields)
      const entries = scopeEntries(chain, entryOptions.scope)
      if (!entries.length) {
        const read = await readGroupValues(plain, id)
        return {
          group: id,
          values: read.values as never,
          defaults: defaults as never,
          changed: Object.keys(group.fields).filter(key => !equal(read.values[key], defaults[key])),
          display: { values: display(group.fields, read.values), defaults: display(group.fields, defaults) },
          notes: await notesFor(id, read.values, entryOptions.host),
          updatedAt: read.updatedAt,
          updatedBy: read.updatedBy
        }
      }
      const key = scopeKey(entries)
      const [targetScope, targetId] = entries[entries.length - 1]!
      const read = await layered(plain, id, entries)
      const [row] = await plain.readGroups([id], key)
      const layers: Record<string, FieldLayer> = {}
      for (const [field, definition] of Object.entries(group.fields)) {
        const rule = overrideRule(definition, targetScope)
        if (!rule) continue
        layers[field] = {
          inherited: read.inherited[field],
          inheritedDisplay: formatValue(definition, read.inherited[field], unitOf),
          from: read.inheritedFrom[field]!,
          fromLabel: await sourceLabel(read.inheritedFrom[field]!, read.plans),
          overridden: field in read.own,
          rule
        }
      }
      return {
        group: id,
        scope: { key, path: pathOf(entries), label: await labelOf(targetScope, targetId) },
        layers,
        values: read.values as never,
        defaults: defaults as never,
        changed: Object.keys(read.own),
        display: { values: display(group.fields, read.values), defaults: display(group.fields, defaults) },
        notes: await notesFor(id, read.values, entryOptions.host),
        updatedAt: row?.updatedAt ?? null,
        updatedBy: row?.updatedBy ?? null
      }
    }

    async function overview() {
      const entries = []
      for (const group of groups.values()) entries.push(await entry(group.id as G[number]['id']))
      return entries
    }

    async function saveGroup(id: string, input: Record<string, unknown>, change: ChangeOptions, restoring?: Revision): Promise<Outcome<GroupEntry>> {
      const group = groupOf(id)
      const outcome = await commit(async (session, announce): Promise<Outcome<GroupEntry>> => {
        await session.lock('exclusive')
        const [row] = await session.readGroups([id])
        const defaults = defaultsOf(group.fields)
        const previous = Object.fromEntries(Object.keys(group.fields).map(key => [key, row && key in row.values ? row.values[key] : defaults[key]]))
        const strange = unknownKeys(group.fields, input)
        if (strange.length) return refused([{ message: `${group.title} has no ${strange.map(key => `"${key}"`).join(', ')}.` }])
        const next = { ...previous, ...structuredClone(input) }

        // Every problem is found before refusing, so one answer names them all.
        // Rule `values-stay-within-their-kind`.
        const fieldProblems = [...checkFields(group.fields, next), ...await checkPicks(session, group.fields, next, previous)]
        const invalid = new Set(fieldProblems.map(problem => problem.key))
        const sound = Object.fromEntries(Object.entries(next).map(([key, value]) => [key, invalid.has(key) ? previous[key] : value]))
        // Rule `settings-that-bound-one-another-agree`.
        const ruleProblems = safely(() => toProblems(group.rules?.(sound as never)))
        if (fieldProblems.length || ruleProblems.length) return refused([...fieldProblems, ...ruleProblems])

        const view = await settingsView(session, { group: id, values: next })
        // Rules `a-limit-is-never-lowered-below-what-uses-it` and `presets-stay-within-the-settings`.
        const dependents = await presetsOutside(session, view)
        for (const guard of (options.guards as Record<string, readonly Guard[] | undefined> | undefined)?.[id] ?? []) {
          dependents.push(...toProblems(await guard({ group: id, scope: {}, next, previous, session, host: change.host })))
        }
        dependents.push(...await overridesOutside(session, id, { rows: new Map([['', next]]) }))
        if (dependents.length) return refused(dependents)

        const changes = diff(previous, next, Object.keys(group.fields))
        if (!changes.length && row) return { saved: true, problems: [] }

        // Rule `a-change-with-consequences-is-confirmed`.
        const question = group.confirm?.(next as never, previous as never)
        if (question && !change.confirmed && changes.length) return { saved: false, problems: [], confirm: question }

        const by = actorName(change.actor)
        await session.writeGroup({ id, scope: '', values: { ...(row?.values ?? {}), ...next }, updatedAt: new Date().toISOString(), updatedBy: by })
        const reason = restoring
          ? [`Restored revision ${restoring.id}.`, change.reason].filter(Boolean).join(' ')
          : (change.reason ?? null)
        // Rule `every-change-is-one-revision`.
        const revision = await session.appendRevision({ target: { kind: 'group', name: id }, actor: by, reason, changes, snapshot: next })
        announce(id, next)
        return { saved: true, problems: [], revision }
      })
      if (outcome.saved) outcome.value = await entry(id as G[number]['id'], { host: change.host }) as GroupEntry
      return outcome
    }

    /**
     * A change at a scope: its own values for the fields it may set, `null` to
     * use the inherited value again. spec/scopes.md.
     */
    async function saveScoped(id: string, entries: ScopeEntries, input: Record<string, unknown>, change: ChangeOptions, restoring?: Revision): Promise<Outcome<GroupEntry>> {
      const group = groupOf(id)
      const key = scopeKey(entries)
      const [scope, scopeId] = entries[entries.length - 1]!
      const outcome = await commit(async (session): Promise<Outcome<GroupEntry>> => {
        await session.lock('exclusive')
        const strange = unknownKeys(group.fields, input)
        if (strange.length) return refused([{ message: `${group.title} has no ${strange.map(name => `"${name}"`).join(', ')}.` }])
        const where = `for ${await labelOf(scope, scopeId)}`
        // Rule `only-declared-fields-are-overridden`.
        const [stored] = await session.readGroups([id], key)
        const notHere = Object.keys(input).filter(field => !overrideRule(group.fields[field]!, scope)
          && !(input[field] === null && stored && field in stored.values))
        if (notHere.length) {
          return refused(notHere.map(field => ({ key: field, message: `${fieldLabel(field, group.fields[field]!)} cannot be set ${where}.` })))
        }
        const before = await layered(session, id, entries)
        const [row] = await session.readGroups([id], key)
        // A field no longer overridable here is dropped on any save, as if cleared.
        const own: Record<string, unknown> = Object.fromEntries(Object.entries(row?.values ?? {}).filter(([field]) => group.fields[field] && overrideRule(group.fields[field]!, scope)))
        for (const [field, value] of Object.entries(structuredClone(input))) {
          if (value === null) delete own[field]
          else own[field] = value
        }
        const next = { ...before.inherited, ...own }
        const previous = before.values

        const setFields = Object.fromEntries(Object.keys(own).map(field => [field, group.fields[field]!]))
        const fieldProblems = [...checkFields(setFields, own), ...await checkPicks(session, setFields, own, before.own)]
        for (const [field, value] of Object.entries(own)) {
          if (fieldProblems.some(problem => problem.key === field)) continue
          const problem = boundProblem(id, field, overrideRule(group.fields[field]!, scope), value, before.inherited[field], where)
          if (problem) fieldProblems.push(problem)
        }
        const ruleProblems = fieldProblems.length ? [] : safely(() => toProblems(group.rules?.(next as never)))
        if (fieldProblems.length || ruleProblems.length) return refused([...fieldProblems, ...ruleProblems])

        const dependents: Problem[] = []
        for (const guard of (options.guards as Record<string, readonly Guard[] | undefined> | undefined)?.[id] ?? []) {
          dependents.push(...toProblems(await guard({ group: id, scope: pathOf(entries), next, previous, session, host: change.host })))
        }
        const planned: Planned = { rows: new Map([[key, Object.keys(own).length ? own : null]]) }
        // Its own values were checked against their bounds above; narrower scopes are checked against them.
        dependents.push(...await overridesOutside(session, id, planned, key))
        if (dependents.length) return refused(dependents)

        // Against the row as stored, so a field cleared because it is no longer overridable is a change too.
        const asStored = row?.values ?? {}
        const changes = diff(asStored, own, new Set([...Object.keys(asStored), ...Object.keys(own)]))
        if (!changes.length) return { saved: true, problems: [] }

        const question = group.confirm?.(next as never, previous as never)
        if (question && !change.confirmed && !equal(next, previous)) return { saved: false, problems: [], confirm: question }

        const by = actorName(change.actor)
        if (Object.keys(own).length) await session.writeGroup({ id, scope: key, values: own, updatedAt: new Date().toISOString(), updatedBy: by })
        else await session.deleteGroup(id, key)
        const reason = restoring
          ? [`Restored revision ${restoring.id}.`, change.reason].filter(Boolean).join(' ')
          : (change.reason ?? null)
        // Rule `every-change-is-one-revision`: the scope's own revision.
        const revision = await session.appendRevision({ target: { kind: 'group', name: id, id: key }, actor: by, reason, changes, snapshot: Object.keys(own).length ? own : null })
        return { saved: true, problems: [], revision }
      })
      if (outcome.saved) outcome.value = await entry(id as G[number]['id'], { host: change.host, scope: pathOf(entries) }) as GroupEntry
      return outcome
    }

    function save<Id extends G[number]['id']>(id: Id, values: Partial<{ [K in keyof GroupValues<GroupOf<G, Id>>]: GroupValues<GroupOf<G, Id>>[K] | null }>, change: ChangeOptions = {}) {
      const entries = scopeEntries(chain, change.scope)
      return (entries.length
        ? saveScoped(id, entries, values as Record<string, unknown>, change)
        : saveGroup(id, values as Record<string, unknown>, change)) as Promise<Outcome<GroupEntry<GroupValues<GroupOf<G, Id>>>>>
    }

    /** Back to the defaults, or, at a scope, back to the inherited values. */
    function reset<Id extends G[number]['id']>(id: Id, keys?: readonly (keyof GroupValues<GroupOf<G, Id>> & string)[], change: ChangeOptions = {}) {
      const group = groupOf(id)
      const entries = scopeEntries(chain, change.scope)
      if (entries.length) {
        const [scope] = entries[entries.length - 1]!
        const chosen = keys ?? Object.keys(group.fields).filter(field => overrideRule(group.fields[field]!, scope))
        const values = Object.fromEntries(chosen.map(field => [field, null]))
        return saveScoped(id, entries, values, { ...change, reason: change.reason ?? (keys ? `Use the inherited ${keys.join(', ')}.` : 'Use the inherited values.') }) as Promise<Outcome<GroupEntry<GroupValues<GroupOf<G, Id>>>>>
      }
      const defaults = defaultsOf(group.fields)
      const chosen = keys ?? Object.keys(group.fields)
      const values = Object.fromEntries(chosen.map(key => [key, defaults[key]]))
      return saveGroup(id, values, { ...change, reason: change.reason ?? (keys ? `Reset ${keys.join(', ')} to default.` : 'Reset to defaults.') }) as Promise<Outcome<GroupEntry<GroupValues<GroupOf<G, Id>>>>>
    }

    async function history(target: RevisionTarget | G[number]['id'], query: { limit?: number, before?: string } = {}): Promise<Revision[]> {
      const resolved: RevisionTarget = typeof target === 'string' ? { kind: 'group', name: groupOf(target).id } : target
      return plain.listRevisions(resolved, { limit: Math.min(Math.max(query.limit ?? 50, 1), 500), before: query.before })
    }

    // Rule `a-restore-is-checked-like-any-change`: a restore is a save of the snapshot.
    async function restore(revisionId: string, change: ChangeOptions = {}): Promise<Outcome<GroupEntry>> {
      const revision = await plain.getRevision(revisionId)
      if (!revision) return refused([{ message: `There is no revision ${revisionId}.` }])
      if (revision.target.kind !== 'group') return refused([{ message: `Revision ${revisionId} is not of a settings group; only settings groups are restored.` }])
      const group = groupOf(revision.target.name)
      const snapshot = (revision.snapshot ?? {}) as Record<string, unknown>
      if (revision.target.id) {
        // A scope's revision puts its own values back exactly: what it did not set, it inherits again.
        const entries = parseScopeKey(revision.target.id)
        const [current] = await plain.readGroups([group.id], revision.target.id)
        const values = { ...Object.fromEntries(Object.keys(current?.values ?? {}).map(field => [field, null])), ...snapshot }
        return saveScoped(group.id, entries, values, change, revision)
      }
      const defaults = defaultsOf(group.fields)
      const values = Object.fromEntries(Object.keys(group.fields).map(key => [key, key in snapshot ? snapshot[key] : defaults[key]]))
      return saveGroup(group.id, values, change, revision)
    }

    /** A host write that depends on tunables takes this, so a limit cannot be lowered under it until it commits. */
    async function hold() {
      if (!scoped) throw new TunablesError('`hold` only means something inside a host transaction: call it on `tunables.within(transaction)`.')
      await plain.lock('shared')
    }

    async function sync(change: ChangeOptions = {}): Promise<SyncReport> {
      const by = actorName(change.actor)
      return commit(async (session) => {
        await session.lock('exclusive')
        const report: SyncReport = { seeded: [], added: [], unknown: [], presets: [], catalog: [] }
        const rows = new Map((await session.readGroups()).map(row => [row.id, row]))
        for (const group of groups.values()) {
          const defaults = defaultsOf(group.fields)
          const row = rows.get(group.id)
          if (!row) {
            await session.writeGroup({ id: group.id, scope: '', values: defaults, updatedAt: new Date().toISOString(), updatedBy: by })
            await session.appendRevision({ target: { kind: 'group', name: group.id }, actor: by, reason: 'Seeded with the defaults.', changes: diff({}, defaults, Object.keys(defaults)), snapshot: defaults })
            report.seeded.push(group.id)
            continue
          }
          const missing = Object.keys(group.fields).filter(key => !(key in row.values))
          // Rule `stored-settings-nobody-declares-are-kept`.
          for (const key of unknownKeys(group.fields, row.values)) report.unknown.push({ group: group.id, key })
          if (!missing.length) continue
          const added = Object.fromEntries(missing.map(key => [key, defaults[key]]))
          const values = { ...row.values, ...added }
          await session.writeGroup({ id: group.id, scope: '', values, updatedAt: new Date().toISOString(), updatedBy: by })
          const snapshot = Object.fromEntries(Object.keys(group.fields).map(key => [key, values[key]]))
          await session.appendRevision({ target: { kind: 'group', name: group.id }, actor: by, reason: 'Added new settings with their defaults.', changes: diff({}, added, missing), snapshot })
          for (const key of missing) report.added.push({ group: group.id, key })
        }

        for (const catalog of catalogs.values()) {
          const existing = await session.listRecords(catalogCollection(catalog.id))
          if (existing.length || !catalog.seed?.length) continue
          for (const seeded of catalog.seed) {
            await session.putRecord({ collection: catalogCollection(catalog.id), id: seeded.id, data: { state: 'available', values: seeded.values } })
            await session.appendRevision({ target: { kind: 'catalog', name: catalog.id, id: seeded.id }, actor: by, reason: 'Seeded.', changes: diff({}, seeded.values, Object.keys(seeded.values)), snapshot: { state: 'available', values: seeded.values } })
            report.catalog.push({ catalog: catalog.id, id: seeded.id })
          }
        }

        for (const set of presetSets.values()) {
          const presets = await listPresets(session, set.id)
          // A field newly declared on a preset set is added to every stored preset with its default.
          const setDefaults = defaultsOf(set.fields)
          for (const preset of presets) {
            const missing = Object.keys(set.fields).filter(key => !(key in preset.values))
            if (!missing.length) continue
            const added = Object.fromEntries(missing.map(key => [key, setDefaults[key]]))
            const data = { slot: preset.slot, label: preset.label, isDefault: preset.isDefault, values: { ...preset.values, ...added } }
            await session.putRecord({ collection: presetCollection(set.id), id: preset.key, data })
            await session.appendRevision({ target: { kind: 'preset', name: set.id, id: preset.key }, actor: by, reason: 'Added new fields with their defaults.', changes: diff({}, added, missing), snapshot: data })
            for (const key of missing) report.added.push({ group: `${set.id}:${preset.key}`, key })
          }
          for (const slot of set.slots) {
            if (presets.some(preset => preset.slot === slot && preset.isDefault)) continue
            const seeds = set.seed?.filter(seed => seed.slot === slot) ?? []
            const planned = (seeds.length ? seeds : [{ key: slot, slot, label: slot.charAt(0).toUpperCase() + slot.slice(1), values: {} }])
              .filter(seed => !presets.some(preset => preset.key === seed.key))
            for (const [index, seed] of planned.entries()) {
              const values = { ...defaultsOf(set.fields), ...seed.values }
              const data = { slot, label: seed.label, isDefault: index === 0, values }
              await session.putRecord({ collection: presetCollection(set.id), id: seed.key, data })
              await session.appendRevision({ target: { kind: 'preset', name: set.id, id: seed.key }, actor: by, reason: 'Seeded.', changes: diff({}, values, Object.keys(values)), snapshot: data })
              report.presets.push({ set: set.id, key: seed.key, slot, isDefault: index === 0 })
            }
          }
        }
        return report
      })
    }

    /* ------------------------------------------------------------ presets */

    function presets(id: string) {
      const set = presetsOf(id)
      const collection = presetCollection(id)

      async function check(session: StoreSession, values: Record<string, unknown>, previous?: Record<string, unknown>): Promise<Problem[]> {
        const fieldProblems = checkFields(set.fields, values)
        if (fieldProblems.length) return fieldProblems
        const problems = await checkPicks(session, set.fields, values, previous)
        if (problems.length) return problems
        const catalogsNow = await catalogView(session)
        problems.push(...toProblems(set.rules?.(values as never, catalogsNow)))
        if (set.within) problems.push(...toProblems(set.within(values as never, await settingsView(session))))
        return problems
      }

      async function list() {
        return listPresets(plain, id)
      }

      async function getPreset(key: string) {
        return (await listPresets(plain, id)).find(preset => preset.key === key)
      }

      async function create(input: { key: string, slot: string, label: string, values?: Record<string, unknown> }, change: ChangeOptions = {}): Promise<Outcome<Preset>> {
        return commit(async (session) => {
          await session.lock('exclusive')
          const all = await listPresets(session, id)
          const problems: Problem[] = []
          if (!KEY_PATTERN.test(input.key)) problems.push({ key: 'key', message: 'A key is lowercase letters, digits and single hyphens, such as "daily-light".' })
          if (all.some(preset => preset.key === input.key)) problems.push({ key: 'key', message: `A ${set.singular} named "${input.key}" already exists.` })
          if (!set.slots.includes(input.slot)) problems.push({ key: 'slot', message: `The slot must be one of: ${set.slots.join(', ')}.` })
          if (!input.label.trim()) problems.push({ key: 'label', message: 'A label is required.' })
          if (problems.length) return refused<Preset>(problems)
          const values = { ...defaultsOf(set.fields), ...structuredClone(input.values ?? {}) }
          const strange = unknownKeys(set.fields, values)
          if (strange.length) return refused<Preset>([{ message: `A ${set.singular} has no ${strange.map(key => `"${key}"`).join(', ')}.` }])
          const checked = await check(session, values)
          if (checked.length) return refused<Preset>(checked)
          // Rule `each-slot-has-one-default-preset`.
          const isDefault = !all.some(preset => preset.slot === input.slot && preset.isDefault)
          const data = { slot: input.slot, label: input.label.trim(), isDefault, values }
          await session.putRecord({ collection, id: input.key, data })
          const by = actorName(change.actor)
          const revision = await session.appendRevision({ target: { kind: 'preset', name: id, id: input.key }, actor: by, reason: change.reason ?? null, changes: diff({}, values, Object.keys(values)), snapshot: data })
          return { saved: true, problems: [], revision, value: toPreset({ collection, id: input.key, data, createdAt: null, updatedAt: revision.at }) }
        })
      }

      async function update(key: string, input: { label?: string, values?: Record<string, unknown> }, change: ChangeOptions = {}): Promise<Outcome<Preset>> {
        return commit(async (session) => {
          await session.lock('exclusive')
          const current = (await listPresets(session, id)).find(preset => preset.key === key)
          if (!current) return refused<Preset>([{ message: `There is no ${set.singular} "${key}".` }])
          const strange = unknownKeys(set.fields, input.values ?? {})
          if (strange.length) return refused<Preset>([{ message: `A ${set.singular} has no ${strange.map(name => `"${name}"`).join(', ')}.` }])
          const previous = { ...defaultsOf(set.fields), ...current.values }
          const values = { ...previous, ...structuredClone(input.values ?? {}) }
          const label = input.label?.trim() ?? current.label
          if (!label) return refused<Preset>([{ key: 'label', message: 'A label is required.' }])
          const checked = await check(session, values, previous)
          if (checked.length) return refused<Preset>(checked)
          const changes = diff(previous, values, Object.keys(set.fields))
          if (label !== current.label) changes.unshift({ key: 'label', from: current.label, to: label })
          if (!changes.length) return { saved: true, problems: [], value: current }
          if (set.layer) {
            const presetsNow = (await listPresets(session, id)).map(preset => preset.key === key ? { ...preset, label, values } : preset)
            const outside = await presetChangeOutside(session, id, { presets: new Map([[id, presetsNow]]) })
            if (outside.length) return refused<Preset>(prefixed(`${set.singular} "${label}"`, outside))
          }
          // Rule `a-presets-key-and-slot-never-change`.
          const data = { slot: current.slot, label, isDefault: current.isDefault, values }
          await session.putRecord({ collection, id: key, data })
          const revision = await session.appendRevision({ target: { kind: 'preset', name: id, id: key }, actor: actorName(change.actor), reason: change.reason ?? null, changes, snapshot: data })
          return { saved: true, problems: [], revision, value: { ...current, label, values } }
        })
      }

      async function remove(key: string, change: ChangeOptions = {}): Promise<Outcome> {
        return commit(async (session) => {
          await session.lock('exclusive')
          const current = (await listPresets(session, id)).find(preset => preset.key === key)
          if (!current) return refused([{ message: `There is no ${set.singular} "${key}".` }])
          // Rule `the-default-preset-cannot-be-removed`.
          if (current.isDefault) return refused([{ message: `"${current.label}" is the default ${set.singular} for ${current.slot}; make another the default first.` }])
          const assigned = await session.listAssignments(collection, { recordId: key })
          if (set.layer) {
            const presetsNow = (await listPresets(session, id)).filter(preset => preset.key !== key)
            const assignmentsNow = (await session.listAssignments(collection)).filter(item => item.recordId !== key)
            const outside = await presetChangeOutside(session, id, { presets: new Map([[id, presetsNow]]), assignments: new Map([[id, assignmentsNow]]) })
            if (outside.length) return refused(prefixed(`Removing "${current.label}"`, outside))
          }
          for (const assignment of assigned) {
            await session.deleteAssignment(collection, assignment.subject, assignment.slot)
            // Rule `every-change-is-one-revision`: each subject returned to the default has its own.
            await session.appendRevision({ target: { kind: 'assignment', name: id, id: assignment.subject }, actor: actorName(change.actor), reason: `"${current.label}" was removed; following the default again.`, changes: [{ key: assignment.slot, from: key, to: null }], snapshot: { slot: assignment.slot, key: null } })
          }
          await session.deleteRecord(collection, key)
          const reason = [change.reason, assigned.length ? `${assigned.length} assigned returned to the default.` : undefined].filter(Boolean).join(' ') || null
          const revision = await session.appendRevision({ target: { kind: 'preset', name: id, id: key }, actor: actorName(change.actor), reason, changes: [{ key: 'removed', from: current.label, to: null }], snapshot: null })
          return { saved: true, problems: [], revision }
        })
      }

      async function makeDefault(key: string, change: ChangeOptions = {}): Promise<Outcome> {
        return commit(async (session) => {
          await session.lock('exclusive')
          const all = await listPresets(session, id)
          const chosen = all.find(preset => preset.key === key)
          if (!chosen) return refused([{ message: `There is no ${set.singular} "${key}".` }])
          if (chosen.isDefault) return { saved: true, problems: [] }
          if (set.layer) {
            const presetsNow = all.map(preset => preset.slot === chosen.slot ? { ...preset, isDefault: preset.key === key } : preset)
            const outside = await presetChangeOutside(session, id, { presets: new Map([[id, presetsNow]]) })
            if (outside.length) return refused(prefixed(`Making "${chosen.label}" the default`, outside))
          }
          for (const preset of all.filter(item => item.slot === chosen.slot && item.isDefault)) {
            const data = { slot: preset.slot, label: preset.label, isDefault: false, values: preset.values }
            await session.putRecord({ collection, id: preset.key, data })
            await session.appendRevision({ target: { kind: 'preset', name: id, id: preset.key }, actor: actorName(change.actor), reason: `"${chosen.label}" became the default for ${chosen.slot}.`, changes: [{ key: 'default', from: true, to: false }], snapshot: data })
          }
          await session.putRecord({ collection, id: key, data: { slot: chosen.slot, label: chosen.label, isDefault: true, values: chosen.values } })
          const revision = await session.appendRevision({ target: { kind: 'preset', name: id, id: key }, actor: actorName(change.actor), reason: change.reason ?? null, changes: [{ key: 'default', from: false, to: true }], snapshot: { ...chosen, isDefault: true } })
          return { saved: true, problems: [], revision }
        })
      }

      /** Assign a preset to a subject for a slot, or `null` to follow the slot's default again. */
      async function assign(subject: string, slot: string, key: string | null, change: ChangeOptions = {}): Promise<Outcome> {
        return commit(async (session) => {
          await session.lock('exclusive')
          if (!set.slots.includes(slot)) return refused([{ message: `The slot must be one of: ${set.slots.join(', ')}.` }])
          const [existing] = (await session.listAssignments(collection, { subject })).filter(item => item.slot === slot)
          if (key === null) {
            if (!existing) return { saved: true, problems: [] }
          } else {
            const chosen = (await listPresets(session, id)).find(preset => preset.key === key)
            if (!chosen) return refused([{ message: `There is no ${set.singular} "${key}".` }])
            if (chosen.slot !== slot) return refused([{ message: `"${chosen.label}" fills ${chosen.slot}, not ${slot}.` }])
            if (existing?.recordId === key) return { saved: true, problems: [] }
          }
          if (set.layer) {
            const others = (await session.listAssignments(collection)).filter(item => !(item.subject === subject && item.slot === slot))
            const assignmentsNow = key === null ? others : [...others, { collection, subject, slot, recordId: key }]
            const outside = await presetChangeOutside(session, id, { assignments: new Map([[id, assignmentsNow]]) })
            if (outside.length) return refused(outside)
          }
          if (key === null) await session.deleteAssignment(collection, subject, slot)
          else await session.putAssignment({ collection, subject, slot, recordId: key })
          const revision = await session.appendRevision({ target: { kind: 'assignment', name: id, id: subject }, actor: actorName(change.actor), reason: change.reason ?? null, changes: [{ key: slot, from: existing?.recordId ?? null, to: key }], snapshot: { slot, key } })
          return { saved: true, problems: [], revision }
        })
      }

      async function assignments(subject?: string) {
        return plain.listAssignments(collection, subject === undefined ? {} : { subject })
      }

      /** The preset a subject runs as for a slot: its assignment, or the slot's default. Keep `key` and `values` with whatever used it. */
      async function resolve(subject: string, slot: string): Promise<{ key: string, label: string, assigned: boolean, values: Record<string, unknown>, resolvedAt: string }> {
        const all = await listPresets(plain, id)
        const [assignment] = (await plain.listAssignments(collection, { subject })).filter(item => item.slot === slot)
        const assigned = assignment ? all.find(preset => preset.key === assignment.recordId) : undefined
        const chosen = assigned ?? all.find(preset => preset.slot === slot && preset.isDefault)
        if (!chosen) throw new TunablesMissing(`${id} ${slot}`, [])
        return { key: chosen.key, label: chosen.label, assigned: Boolean(assigned), values: { ...defaultsOf(set.fields), ...chosen.values }, resolvedAt: new Date().toISOString() }
      }

      return { definition: set, list, get: getPreset, create, update, remove, makeDefault, assign, assignments, resolve }
    }

    /* ----------------------------------------------------------- catalogs */

    // Rule `catalog-entries-are-never-deleted`: there is no removal, only retiring.
    function catalog(id: string) {
      const definition = catalogOf(id)
      const collection = catalogCollection(id)
      const nameOf = (entry: CatalogEntry) => definition.labelField ? String(entry.values[definition.labelField] ?? entry.id) : entry.id

      async function list() {
        return (await plain.listRecords(collection)).map(toEntry)
      }

      async function usersOf(session: StoreSession, entry: string, host: unknown): Promise<string[]> {
        const names: string[] = []
        for (const set of presetSets.values()) {
          const picks = Object.entries(set.fields).filter(([, field]) => field.kind === 'pick' && field.catalog === id).map(([key]) => key)
          if (!picks.length) continue
          for (const preset of await listPresets(session, set.id)) {
            if (picks.some(key => preset.values[key] === entry)) names.push(`${set.singular} "${preset.label}"`)
          }
        }
        // A setting that picks it, for the whole system or at a scope, uses it too.
        for (const group of groups.values()) {
          const picks = Object.entries(group.fields).filter(([, field]) => field.kind === 'pick' && field.catalog === id).map(([key]) => key)
          if (!picks.length) continue
          const system = (await readGroupValues(session, group.id)).values
          for (const key of picks.filter(field => system[field] === entry)) names.push(`${group.title} › ${fieldLabel(key, group.fields[key]!)}`)
          for (const row of await session.readScopes(group.id)) {
            if (!row.scope) continue
            const entries = parseScopeKey(row.scope)
            const [scope, scopeId] = entries[entries.length - 1]!
            for (const key of picks.filter(field => row.values[field] === entry)) names.push(`${group.title} › ${fieldLabel(key, group.fields[key]!)} for ${await labelOf(scope, scopeId)}`)
          }
        }
        const extra = options.uses?.[id]
        if (extra) names.push(...await extra({ catalog: id, entry, session, host }))
        return names
      }

      /** Presets that would no longer pass their own rules if this entry changed so. */
      async function presetsBrokenBy(session: StoreSession, entry: CatalogEntry): Promise<Problem[]> {
        const view = await catalogView(session, { catalog: id, entry })
        const problems: Problem[] = []
        for (const set of presetSets.values()) {
          if (!set.rules) continue
          for (const preset of await listPresets(session, set.id)) {
            const values = { ...defaultsOf(set.fields), ...preset.values }
            problems.push(...prefixed(`${set.singular} "${preset.label}"`, toProblems(set.rules(values as never, view))))
          }
        }
        return problems
      }

      async function add(input: { id: string, values: Record<string, unknown> }, change: ChangeOptions = {}): Promise<Outcome<CatalogEntry>> {
        return commit(async (session) => {
          await session.lock('exclusive')
          const existing = (await session.listRecords(collection)).map(toEntry)
          const problems: Problem[] = []
          if (!input.id.trim() || /\s/.test(input.id)) problems.push({ key: 'id', message: `${definition.idLabel ?? 'An id'} is required and has no spaces.` })
          if (existing.some(entry => entry.id === input.id)) problems.push({ key: 'id', message: `${definition.title} already holds "${input.id}".` })
          const values = { ...defaultsOf(definition.fields), ...structuredClone(input.values) }
          const strange = unknownKeys(definition.fields, values)
          if (strange.length) problems.push({ message: `A ${definition.singular} has no ${strange.map(key => `"${key}"`).join(', ')}.` })
          if (problems.length) return refused<CatalogEntry>(problems)
          const checked = [...checkFields(definition.fields, values), ...toProblems(definition.rules?.(values as never))]
          if (checked.length) return refused<CatalogEntry>(checked)
          const data = { state: 'available', values }
          await session.putRecord({ collection, id: input.id, data })
          const revision = await session.appendRevision({ target: { kind: 'catalog', name: id, id: input.id }, actor: actorName(change.actor), reason: change.reason ?? null, changes: diff({}, values, Object.keys(values)), snapshot: data })
          return { saved: true, problems: [], revision, value: { id: input.id, state: 'available', values, createdAt: revision.at } }
        })
      }

      async function edit(entryId: string, input: Record<string, unknown>, change: ChangeOptions = {}): Promise<Outcome<CatalogEntry>> {
        return commit(async (session) => {
          await session.lock('exclusive')
          const current = (await session.listRecords(collection)).map(toEntry).find(entry => entry.id === entryId)
          if (!current) return refused<CatalogEntry>([{ message: `${definition.title} has no "${entryId}".` }])
          const strange = unknownKeys(definition.fields, input)
          if (strange.length) return refused<CatalogEntry>([{ message: `A ${definition.singular} has no ${strange.map(key => `"${key}"`).join(', ')}.` }])
          const previous = { ...defaultsOf(definition.fields), ...current.values }
          const values = { ...previous, ...structuredClone(input) }
          const checked = [...checkFields(definition.fields, values), ...toProblems(definition.rules?.(values as never))]
          if (checked.length) return refused<CatalogEntry>(checked)
          const next = { ...current, values }
          const broken = await presetsBrokenBy(session, next)
          if (broken.length) return refused<CatalogEntry>(broken)
          const changes = diff(previous, values, Object.keys(definition.fields))
          if (!changes.length) return { saved: true, problems: [], value: current }
          const data = { state: current.state, values }
          await session.putRecord({ collection, id: entryId, data })
          const revision = await session.appendRevision({ target: { kind: 'catalog', name: id, id: entryId }, actor: actorName(change.actor), reason: change.reason ?? null, changes, snapshot: data })
          return { saved: true, problems: [], revision, value: next }
        })
      }

      async function setState(entryId: string, state: 'available' | 'retired', change: ChangeOptions): Promise<Outcome<CatalogEntry>> {
        return commit(async (session) => {
          await session.lock('exclusive')
          const current = (await session.listRecords(collection)).map(toEntry).find(entry => entry.id === entryId)
          if (!current) return refused<CatalogEntry>([{ message: `${definition.title} has no "${entryId}".` }])
          if (current.state === state) return { saved: true, problems: [], value: current }
          if (state === 'retired') {
            // Rule `a-catalog-entry-in-use-stays-available`.
            const users = await usersOf(session, entryId, change.host)
            if (users.length) return refused<CatalogEntry>([{ message: `${nameOf(current)} is in use by ${users.join(', ')}; move them to another ${definition.singular.toLowerCase()} first.` }])
          }
          const data = { state, values: current.values }
          await session.putRecord({ collection, id: entryId, data })
          const revision = await session.appendRevision({ target: { kind: 'catalog', name: id, id: entryId }, actor: actorName(change.actor), reason: change.reason ?? null, changes: [{ key: 'state', from: current.state, to: state }], snapshot: data })
          return { saved: true, problems: [], revision, value: { ...current, state } }
        })
      }

      async function usedBy(entryId: string, host?: unknown) {
        return usersOf(plain, entryId, host)
      }

      return {
        definition,
        list,
        get: async (entryId: string) => (await list()).find(entry => entry.id === entryId),
        available: async () => (await list()).filter(entry => entry.state === 'available'),
        add,
        edit,
        retire: (entryId: string, change: ChangeOptions = {}) => setState(entryId, 'retired', change),
        reinstate: (entryId: string, change: ChangeOptions = {}) => setState(entryId, 'available', change),
        usedBy
      }
    }

    return { get, entry, overview, save, reset, history, restore, hold, committed, sync, presets, catalog }
  }

  const root = api(work => store.transaction(work), store, false)

  return {
    ...root,
    /** Every definition, as the screens and the API describe it. */
    describe(): Description {
      return describe({ groups: [...groups.values()], presets: [...presetSets.values()], catalogs: [...catalogs.values()], effects, scopes: chain }, options.explanations, unitOf)
    },
    /**
     * The same API inside a transaction the host app has open: reads see its
     * writes, and changes commit with it. Call `committed()` after the host
     * commits, so listeners hear the changes; after a rollback, don't.
     */
    within(host: unknown) {
      if (!store.within) throw new TunablesError('This store cannot join a host transaction.')
      const session = store.within(host)
      return api(work => work(session), session, true)
    },
    /** Called after a group's change commits in this process, with its new values. */
    onChange<Id extends G[number]['id']>(id: Id, listener: (values: GroupValues<GroupOf<G, Id>>) => void): () => void {
      groupOf(id)
      const set = listeners.get(id) ?? new Set()
      set.add(listener as (values: Record<string, unknown>) => void)
      listeners.set(id, set)
      return () => set.delete(listener as (values: Record<string, unknown>) => void)
    },
    definitions: { groups: options.groups, presets: options.presets ?? [], catalogs: options.catalogs ?? [], units, effects, scopes: chain },
    store
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any set of groups: the service and CLI take whichever an app defines
export type Tunables<G extends readonly AnyGroup[] = any> = ReturnType<typeof createTunables<G>>

export type PresetsApi = ReturnType<Tunables['presets']>
export type CatalogApi = ReturnType<Tunables['catalog']>

/**
 * Any app's tunables, by plain ids: what the server, the CLI and tooling use,
 * whichever groups an app defines.
 */
export interface AnyTunables {
  describe(): Description
  readonly definitions: { groups: readonly AnyGroup[], presets: readonly AnyPresets[], catalogs: readonly AnyCatalog[], units: Readonly<Record<string, Unit>>, effects: Effects, scopes: readonly string[] }
  readonly store: TunablesStore
  get(id: string, options?: { scope?: ScopePath, lastGood?: boolean }): Promise<Record<string, unknown>>
  entry(id: string, options?: { host?: unknown, scope?: ScopePath }): Promise<GroupEntry>
  save(id: string, values: Record<string, unknown>, change?: ChangeOptions): Promise<Outcome<GroupEntry>>
  reset(id: string, keys?: readonly string[], change?: ChangeOptions): Promise<Outcome<GroupEntry>>
  history(target: RevisionTarget | string, query?: { limit?: number, before?: string }): Promise<Revision[]>
  restore(revisionId: string, change?: ChangeOptions): Promise<Outcome<GroupEntry>>
  sync(change?: ChangeOptions): Promise<SyncReport>
  presets(id: string): PresetsApi
  catalog(id: string): CatalogApi
}
