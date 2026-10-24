import { computed, inject, onBeforeUnmount, onMounted, provide, reactive, ref, shallowRef, watch, type InjectionKey, type Ref } from 'vue'
import type { CatalogEntrySummary, PresetSummary, TunablesClient } from '../client/index.js'
import type { Description, FieldDescription, GroupDescription } from '../engine/describe.js'
import type { GroupEntry, Outcome } from '../engine/tunables.js'
import type { ScopePath } from '../engine/scopes.js'
import type { Revision, RevisionTarget } from '../engine/store.js'
import type { Problem } from '../model/definitions.js'

/**
 * Headless composables for tunables' screens: what a form, a history or a
 * catalog panel needs, with no markup. `tunables/nuxt` builds its Nuxt UI
 * screens on these; another design system can build its own.
 */

export const TUNABLES_CLIENT: InjectionKey<TunablesClient> = Symbol('tunables-client')

/** Make a client available to every tunables composable below this component. */
export function provideTunables(client: TunablesClient): void {
  provide(TUNABLES_CLIENT, client)
}

export function useTunablesClient(): TunablesClient {
  const client = inject(TUNABLES_CLIENT, undefined)
  if (!client) throw new Error('tunables: no client is provided. Call provideTunables(client), or install the tunables Nuxt layer.')
  return client
}

const clone = <T>(value: T): T => (value === undefined ? value : JSON.parse(JSON.stringify(value)) as T)
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const failure = (error: unknown) => error instanceof Error ? error.message : String(error)

/* ------------------------------------------------------------- description */

const descriptions = new WeakMap<TunablesClient, Promise<Description>>()

/** The definitions as the screens see them, fetched once per client. */
export function useTunablesDescription() {
  const client = useTunablesClient()
  const description = shallowRef<Description>()
  const error = ref<string>()
  const pending = ref(true)

  async function load(force = false) {
    pending.value = true
    try {
      if (force || !descriptions.has(client)) descriptions.set(client, client.describe())
      description.value = await descriptions.get(client)!
      error.value = undefined
    } catch (caught) {
      descriptions.delete(client)
      error.value = failure(caught)
    } finally {
      pending.value = false
    }
  }
  onMounted(() => load())
  return { description, error, pending, refresh: () => load(true) }
}

/* -------------------------------------------------------------- group form */

/**
 * One group's form: the stored entry, a draft being edited, which fields
 * differ, the problems the last save answered with, and a confirmation the
 * server asked for.
 */
export function useGroupForm(groupId: Ref<string> | string, options: { scope?: Ref<ScopePath | undefined> | ScopePath } = {}) {
  const client = useTunablesClient()
  const id = computed(() => typeof groupId === 'string' ? groupId : groupId.value)
  const scope = computed<ScopePath | undefined>(() => {
    const value = options.scope && 'value' in options.scope ? (options.scope as Ref<ScopePath | undefined>).value : options.scope as ScopePath | undefined
    return value && Object.keys(value).length ? value : undefined
  })
  const { description, error: describeError } = useTunablesDescription()
  const group = computed<GroupDescription | undefined>(() => description.value?.groups.find(item => item.id === id.value))
  const entry = shallowRef<GroupEntry>()
  const draft = reactive<Record<string, unknown>>({})
  const problems = ref<Problem[]>([])
  const confirm = ref<string>()
  const reason = ref('')
  const loading = ref(true)
  const saving = ref(false)
  const error = ref<string>()
  const lastSaved = ref<Outcome<GroupEntry>>()

  function adopt(next: GroupEntry) {
    entry.value = next
    for (const key of Object.keys(draft)) delete draft[key]
    Object.assign(draft, clone(next.values))
    inheriting.clear()
  }

  /** At a scope: stop setting a field here, and use what it inherits. */
  function useInherited(key: string) {
    const layer = entry.value?.layers?.[key]
    if (!layer) return
    inheriting.add(key)
    draft[key] = clone(layer.inherited)
  }

  /** At a scope: set a field here again, starting from what it inherits. */
  function setHere(key: string) {
    inheriting.delete(key)
  }

  async function refresh() {
    loading.value = true
    try {
      adopt(await client.group(id.value, scope.value))
      error.value = undefined
    } catch (caught) {
      error.value = failure(caught)
    } finally {
      loading.value = false
    }
  }

  /** At a scope, the fields it may set; for the system, every field. */
  const editable = computed(() => entry.value?.layers ? Object.keys(entry.value.layers) : Object.keys(entry.value?.values ?? {}))
  /** At a scope: the fields that will use the inherited value again on save. */
  const inheriting = reactive(new Set<string>())
  const dirtyKeys = computed(() => {
    if (!entry.value) return []
    const stored = entry.value.values as Record<string, unknown>
    if (!entry.value.layers) return Object.keys(stored).filter(key => !same(draft[key], stored[key]))
    return editable.value.filter((key) => {
      const layer = entry.value!.layers![key]!
      if (inheriting.has(key)) return layer.overridden
      return !same(draft[key], stored[key]) || (!layer.overridden && !same(draft[key], layer.inherited))
    })
  })
  const dirty = computed(() => dirtyKeys.value.length > 0)

  function fieldProblems(key: string): string[] {
    return problems.value.filter(problem => problem.key === key).map(problem => problem.message)
  }
  const generalProblems = computed(() => problems.value.filter(problem => !problem.key || !group.value?.fields.some(field => field.key === problem.key)))

  function isDefault(field: FieldDescription): boolean {
    return same(draft[field.key], field.default)
  }

  /** Put one field's draft back at its default; saved with the rest. */
  function toDefault(field: FieldDescription) {
    draft[field.key] = clone(field.default)
  }

  function discard() {
    if (entry.value) adopt(entry.value)
    inheriting.clear()
    problems.value = []
    confirm.value = undefined
  }

  async function save(saveOptions: { confirmed?: boolean } = {}): Promise<boolean> {
    if (!entry.value) return false
    saving.value = true
    try {
      const values = Object.fromEntries(dirtyKeys.value.map(key => [key, inheriting.has(key) ? null : clone(draft[key])]))
      const outcome = await client.save(id.value, { values, reason: reason.value.trim() || undefined, confirmed: saveOptions.confirmed, scope: scope.value })
      lastSaved.value = outcome
      problems.value = outcome.problems
      confirm.value = outcome.confirm
      if (outcome.saved && outcome.value) {
        adopt(outcome.value)
        reason.value = ''
      }
      error.value = undefined
      return outcome.saved
    } catch (caught) {
      error.value = failure(caught)
      return false
    } finally {
      saving.value = false
    }
  }

  watch([id, scope], () => refresh(), { deep: true })
  onMounted(refresh)

  return {
    group,
    entry,
    scope,
    editable,
    inheriting,
    useInherited,
    setHere,
    draft,
    dirty,
    dirtyKeys,
    problems,
    generalProblems,
    fieldProblems,
    confirm,
    reason,
    loading,
    saving,
    error: computed(() => error.value ?? describeError.value),
    lastSaved,
    isDefault,
    toDefault,
    discard,
    save,
    confirmAndSave: () => save({ confirmed: true }),
    cancelConfirm: () => { confirm.value = undefined },
    refresh
  }
}

/* ----------------------------------------------------------------- overview */

/** Every group's entry, for All settings. */
export function useOverview() {
  const client = useTunablesClient()
  const entries = shallowRef<GroupEntry[]>([])
  const loading = ref(true)
  const error = ref<string>()
  async function refresh() {
    loading.value = true
    try {
      entries.value = await client.overview()
      error.value = undefined
    } catch (caught) {
      error.value = failure(caught)
    } finally {
      loading.value = false
    }
  }
  onMounted(refresh)
  return { entries, loading, error, refresh }
}

/* ------------------------------------------------------------------ history */

/** A target's revisions, newest first, a page at a time; and restoring a group's. */
export function useHistory(target: Ref<RevisionTarget> | RevisionTarget, options: { pageSize?: number } = {}) {
  const client = useTunablesClient()
  const resolved = computed(() => 'value' in target ? target.value : target)
  const pageSize = options.pageSize ?? 20
  const revisions = ref<Revision[]>([])
  const more = ref(false)
  const loading = ref(true)
  const error = ref<string>()

  async function load(append: boolean) {
    loading.value = true
    try {
      const before = append ? revisions.value.at(-1)?.id : undefined
      const page = await client.history({ ...resolved.value, limit: pageSize + 1, before })
      more.value = page.length > pageSize
      const items = page.slice(0, pageSize)
      revisions.value = append ? [...revisions.value, ...items] : items
      error.value = undefined
    } catch (caught) {
      error.value = failure(caught)
    } finally {
      loading.value = false
    }
  }

  async function restore(revision: string, input: { reason?: string, confirmed?: boolean } = {}) {
    const outcome = await client.restore({ revision, ...input })
    if (outcome.saved) await load(false)
    return outcome
  }

  watch(resolved, () => load(false), { deep: true })
  onMounted(() => load(false))
  return { revisions, more, loading, error, loadMore: () => load(true), refresh: () => load(false), restore }
}

/* ------------------------------------------------------------------ presets */

export function usePresets(set: Ref<string> | string) {
  const client = useTunablesClient()
  const id = computed(() => typeof set === 'string' ? set : set.value)
  const presets = ref<PresetSummary[]>([])
  const loading = ref(true)
  const error = ref<string>()
  async function refresh() {
    loading.value = true
    try {
      presets.value = await client.presets(id.value)
      error.value = undefined
    } catch (caught) {
      error.value = failure(caught)
    } finally {
      loading.value = false
    }
  }
  const after = async <T extends Outcome<unknown>>(work: Promise<T>): Promise<T> => {
    const outcome = await work
    if (outcome.saved) await refresh()
    return outcome
  }
  watch(id, refresh)
  onMounted(refresh)
  return {
    presets,
    loading,
    error,
    refresh,
    create: (input: Parameters<TunablesClient['createPreset']>[1]) => after(client.createPreset(id.value, input)),
    update: (key: string, input: Parameters<TunablesClient['updatePreset']>[2]) => after(client.updatePreset(id.value, key, input)),
    remove: (key: string, reason?: string) => after(client.removePreset(id.value, key, { reason })),
    makeDefault: (key: string, reason?: string) => after(client.makeDefault(id.value, key, { reason })),
    assign: (subject: string, slot: string, key: string | null, reason?: string) => after(client.assign(id.value, subject, slot, { key, reason })),
    assignments: (subject?: string) => client.assignments(id.value, subject)
  }
}

/* ----------------------------------------------------------------- catalogs */

export function useCatalog(catalog: Ref<string> | string) {
  const client = useTunablesClient()
  const id = computed(() => typeof catalog === 'string' ? catalog : catalog.value)
  const entries = ref<CatalogEntrySummary[]>([])
  const loading = ref(true)
  const error = ref<string>()
  async function refresh() {
    loading.value = true
    try {
      entries.value = await client.catalog(id.value)
      error.value = undefined
    } catch (caught) {
      error.value = failure(caught)
    } finally {
      loading.value = false
    }
  }
  const after = async <T extends Outcome<unknown>>(work: Promise<T>): Promise<T> => {
    const outcome = await work
    if (outcome.saved) await refresh()
    return outcome
  }
  watch(id, refresh)
  onMounted(refresh)
  return {
    entries,
    available: computed(() => entries.value.filter(entry => entry.state === 'available')),
    loading,
    error,
    refresh,
    add: (input: Parameters<TunablesClient['addEntry']>[1]) => after(client.addEntry(id.value, input)),
    edit: (entry: string, values: Record<string, unknown>, reason?: string) => after(client.editEntry(id.value, entry, { values, reason })),
    retire: (entry: string, reason?: string) => after(client.retire(id.value, entry, { reason })),
    reinstate: (entry: string, reason?: string) => after(client.reinstate(id.value, entry, { reason }))
  }
}

/* -------------------------------------------------------------- leave guard */

/** Ask before the page unloads while there are unsaved changes. Routers add their own guard. */
export function useUnloadGuard(dirty: Ref<boolean>) {
  const warn = (event: BeforeUnloadEvent) => {
    if (!dirty.value) return
    event.preventDefault()
    event.returnValue = ''
  }
  onMounted(() => window.addEventListener('beforeunload', warn))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', warn))
}

export { displayValue } from '../client/format.js'
export type { TunablesClient, PresetSummary, CatalogEntrySummary } from '../client/index.js'
export type { Description, FieldDescription, GroupDescription, PresetsDescription, CatalogDescription } from '../engine/describe.js'
export type { GroupEntry, Outcome } from '../engine/tunables.js'
export type { Revision, RevisionTarget } from '../engine/store.js'
export type { ScopePath } from '../engine/scopes.js'
export type { FieldLayer } from '../engine/tunables.js'
export type { Problem } from '../model/definitions.js'
