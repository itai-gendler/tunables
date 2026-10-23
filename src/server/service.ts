import { z } from 'zod'
import type { Actor, AnyTunables, ChangeOptions } from '../engine/tunables.js'
import type { RevisionTarget } from '../engine/store.js'

/**
 * Every operation the screens and other clients use, once, with access decided
 * by the host app on every call. The fetch handler, Express and oRPC adapters
 * only translate requests into these. spec/handlers.md is the contract.
 */

export type Action = 'read' | 'change'

export interface AccessTarget {
  kind: 'description' | 'group' | 'presets' | 'catalog' | 'history'
  /** The group, preset set or catalog. Absent for the description and the overview. */
  id?: string
}

export interface ServiceOptions<Context> {
  tunables: AnyTunables
  /** Who is asking, from the host's own sign-in. Undefined when nobody is signed in. */
  actor: (context: Context) => Actor | undefined | Promise<Actor | undefined>
  /**
   * Whether this actor may do this. Asked on every request; tunables has no
   * users or roles of its own. Without it, nothing is allowed.
   */
  authorize?: (context: Context, request: { action: Action, target: AccessTarget, actor: Actor }) => boolean | Promise<boolean>
  /**
   * How a refusal answers: as "not found" (the default), so an outsider cannot
   * tell the administration exists, or as "forbidden".
   */
  refusal?: 'not-found' | 'forbidden'
  /** What guards, notes and uses receive as `host`, such as the request's database. */
  host?: (context: Context) => unknown
}

export class ServiceError extends Error {
  constructor(readonly status: 400 | 401 | 403 | 404, message: string) {
    super(message)
    this.name = 'ServiceError'
  }
}

/* ------------------------------------------------------------------ inputs */

const reason = z.string().trim().max(500).optional()
export const inputs = {
  save: z.object({ values: z.record(z.string(), z.unknown()), reason, confirmed: z.boolean().optional() }),
  reset: z.object({ keys: z.array(z.string()).optional(), reason }),
  history: z.object({
    kind: z.enum(['group', 'preset', 'catalog', 'assignment']),
    name: z.string().min(1),
    id: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
    before: z.string().regex(/^\d+$/).optional()
  }),
  restore: z.object({ revision: z.string().min(1), reason, confirmed: z.boolean().optional() }),
  createPreset: z.object({ key: z.string(), slot: z.string(), label: z.string(), values: z.record(z.string(), z.unknown()).optional(), reason }),
  updatePreset: z.object({ label: z.string().optional(), values: z.record(z.string(), z.unknown()).optional(), reason }),
  change: z.object({ reason }),
  assign: z.object({ key: z.string().nullable(), reason }),
  addEntry: z.object({ id: z.string(), values: z.record(z.string(), z.unknown()), reason }),
  editEntry: z.object({ values: z.record(z.string(), z.unknown()), reason })
}

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value ?? {})
  if (!result.success) throw new ServiceError(400, result.error.issues.map(issue => `${issue.path.join('.') || 'body'}: ${issue.message}`).join(' '))
  return result.data
}

/* ----------------------------------------------------------------- service */

export function createService<Context>(options: ServiceOptions<Context>) {
  const { tunables } = options
  const definitions = tunables.definitions
  const exists = {
    group: (id: string) => definitions.groups.some(group => group.id === id),
    presets: (id: string) => definitions.presets.some(set => set.id === id),
    catalog: (id: string) => definitions.catalogs.some(catalog => catalog.id === id)
  }

  // Rule `only-whom-the-host-allows-reads-or-changes-tunables`.
  async function allow(context: Context, action: Action, target: AccessTarget): Promise<{ actor: Actor, change: Pick<ChangeOptions, 'actor' | 'host'> }> {
    const actor = await options.actor(context)
    if (actor === undefined) throw new ServiceError(options.refusal === 'forbidden' ? 401 : 404, options.refusal === 'forbidden' ? 'Sign in first.' : 'Not found.')
    const allowed = options.authorize ? await options.authorize(context, { action, target, actor }) : false
    if (!allowed) throw options.refusal === 'forbidden' ? new ServiceError(403, 'You may not do this.') : new ServiceError(404, 'Not found.')
    if (target.id !== undefined && target.kind !== 'description' && target.kind !== 'history' && !exists[target.kind](target.id)) {
      throw new ServiceError(404, `No ${target.kind === 'presets' ? 'preset set' : target.kind} "${target.id}".`)
    }
    return { actor, change: { actor, host: options.host?.(context) } }
  }

  const historyTarget = (target: RevisionTarget): AccessTarget => {
    const kind = target.kind === 'group' ? 'group' : target.kind === 'catalog' ? 'catalog' : 'presets'
    if (!exists[kind](target.name)) throw new ServiceError(404, `No ${kind === 'presets' ? 'preset set' : kind} "${target.name}".`)
    return { kind, id: target.name }
  }

  return {
    async describe(context: Context) {
      await allow(context, 'read', { kind: 'description' })
      return tunables.describe()
    },
    async overview(context: Context) {
      const { change } = await allow(context, 'read', { kind: 'group' })
      const entries = []
      for (const group of definitions.groups) entries.push(await tunables.entry(group.id, { host: change.host }))
      return entries
    },
    async group(context: Context, id: string) {
      const { change } = await allow(context, 'read', { kind: 'group', id })
      return tunables.entry(id, { host: change.host })
    },
    async save(context: Context, id: string, body: unknown) {
      const input = parse(inputs.save, body)
      const { change } = await allow(context, 'change', { kind: 'group', id })
      return tunables.save(id, input.values, { ...change, reason: input.reason, confirmed: input.confirmed })
    },
    async reset(context: Context, id: string, body: unknown) {
      const input = parse(inputs.reset, body)
      const { change } = await allow(context, 'change', { kind: 'group', id })
      return tunables.reset(id, input.keys, { ...change, reason: input.reason })
    },
    async history(context: Context, query: unknown) {
      const input = parse(inputs.history, query)
      const target: RevisionTarget = input.id ? { kind: input.kind, name: input.name, id: input.id } : { kind: input.kind, name: input.name }
      await allow(context, 'read', historyTarget(target))
      return tunables.history(target, { limit: input.limit, before: input.before })
    },
    async restore(context: Context, body: unknown) {
      const input = parse(inputs.restore, body)
      const revision = (await tunables.store.getRevision(input.revision))
      const group = revision?.target.kind === 'group' ? revision.target.name : undefined
      const { change } = await allow(context, 'change', { kind: 'group', id: group && exists.group(group) ? group : undefined })
      return tunables.restore(input.revision, { ...change, reason: input.reason, confirmed: input.confirmed })
    },
    async presets(context: Context, set: string) {
      await allow(context, 'read', { kind: 'presets', id: set })
      const presets = tunables.presets(set)
      const list = await presets.list()
      const assignments = await presets.assignments()
      return list.map(preset => ({ ...preset, assigned: assignments.filter(item => item.recordId === preset.key).length }))
    },
    async createPreset(context: Context, set: string, body: unknown) {
      const input = parse(inputs.createPreset, body)
      const { change } = await allow(context, 'change', { kind: 'presets', id: set })
      return tunables.presets(set).create(input, { ...change, reason: input.reason })
    },
    async updatePreset(context: Context, set: string, key: string, body: unknown) {
      const input = parse(inputs.updatePreset, body)
      const { change } = await allow(context, 'change', { kind: 'presets', id: set })
      return tunables.presets(set).update(key, input, { ...change, reason: input.reason })
    },
    async removePreset(context: Context, set: string, key: string, body: unknown) {
      const input = parse(inputs.change, body)
      const { change } = await allow(context, 'change', { kind: 'presets', id: set })
      return tunables.presets(set).remove(key, { ...change, reason: input.reason })
    },
    async makeDefault(context: Context, set: string, key: string, body: unknown) {
      const input = parse(inputs.change, body)
      const { change } = await allow(context, 'change', { kind: 'presets', id: set })
      return tunables.presets(set).makeDefault(key, { ...change, reason: input.reason })
    },
    async assignments(context: Context, set: string, subject?: string) {
      await allow(context, 'read', { kind: 'presets', id: set })
      return tunables.presets(set).assignments(subject)
    },
    async assign(context: Context, set: string, subject: string, slot: string, body: unknown) {
      const input = parse(inputs.assign, body)
      const { change } = await allow(context, 'change', { kind: 'presets', id: set })
      return tunables.presets(set).assign(subject, slot, input.key, { ...change, reason: input.reason })
    },
    async catalog(context: Context, id: string) {
      const { change } = await allow(context, 'read', { kind: 'catalog', id })
      const catalog = tunables.catalog(id)
      const entries = await catalog.list()
      return Promise.all(entries.map(async entry => ({ ...entry, usedBy: await catalog.usedBy(entry.id, change.host) })))
    },
    async addEntry(context: Context, id: string, body: unknown) {
      const input = parse(inputs.addEntry, body)
      const { change } = await allow(context, 'change', { kind: 'catalog', id })
      return tunables.catalog(id).add(input, { ...change, reason: input.reason })
    },
    async editEntry(context: Context, id: string, entry: string, body: unknown) {
      const input = parse(inputs.editEntry, body)
      const { change } = await allow(context, 'change', { kind: 'catalog', id })
      return tunables.catalog(id).edit(entry, input.values, { ...change, reason: input.reason })
    },
    async retire(context: Context, id: string, entry: string, body: unknown) {
      const input = parse(inputs.change, body)
      const { change } = await allow(context, 'change', { kind: 'catalog', id })
      return tunables.catalog(id).retire(entry, { ...change, reason: input.reason })
    },
    async reinstate(context: Context, id: string, entry: string, body: unknown) {
      const input = parse(inputs.change, body)
      const { change } = await allow(context, 'change', { kind: 'catalog', id })
      return tunables.catalog(id).reinstate(entry, { ...change, reason: input.reason })
    }
  }
}

export type TunablesService<Context = unknown> = ReturnType<typeof createService<Context>>
