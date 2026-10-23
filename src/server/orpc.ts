import { ORPCError, os } from '@orpc/server'
import { z } from 'zod'
import { errorResponse } from './index.js'
import { createService, inputs, type ServiceOptions } from './service.js'

/**
 * tunables' operations as an oRPC router, to nest in the host's own router:
 *
 *   const router = { ...appRouter, tunables: tunablesRouter({ tunables, actor, authorize }) }
 *
 * The procedures receive the host router's context, so `actor` and `authorize`
 * read the same session the rest of the app does. A refused change is an
 * answer with `problems`, not an error; errors are the service's own.
 */
export function tunablesRouter<Context extends Record<PropertyKey, any>>(options: ServiceOptions<Context>) {
  const service = createService(options)
  const base = os.$context<Context>()

  async function run<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work()
    } catch (error) {
      const { status, body } = errorResponse(error)
      const code = status === 400 ? 'BAD_REQUEST' : status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : status === 409 ? 'CONFLICT' : 'INTERNAL_SERVER_ERROR'
      throw new ORPCError(code, { message: body.error, status })
    }
  }

  const id = z.object({ id: z.string() })
  const set = z.object({ set: z.string() })
  const entry = z.object({ id: z.string(), entry: z.string() })

  return {
    describe: base.handler(({ context }) => run(() => service.describe(context))),
    overview: base.handler(({ context }) => run(() => service.overview(context))),
    group: base.input(id).handler(({ context, input }) => run(() => service.group(context, input.id))),
    save: base.input(inputs.save.extend({ id: z.string() })).handler(({ context, input }) => run(() => service.save(context, input.id, input))),
    reset: base.input(inputs.reset.extend({ id: z.string() })).handler(({ context, input }) => run(() => service.reset(context, input.id, input))),
    history: base.input(inputs.history).handler(({ context, input }) => run(() => service.history(context, input))),
    restore: base.input(inputs.restore).handler(({ context, input }) => run(() => service.restore(context, input))),
    presets: base.input(set).handler(({ context, input }) => run(() => service.presets(context, input.set))),
    createPreset: base.input(inputs.createPreset.extend({ set: z.string() })).handler(({ context, input }) => run(() => service.createPreset(context, input.set, input))),
    updatePreset: base.input(inputs.updatePreset.extend({ set: z.string(), key: z.string() })).handler(({ context, input }) => run(() => service.updatePreset(context, input.set, input.key, input))),
    removePreset: base.input(inputs.change.extend({ set: z.string(), key: z.string() })).handler(({ context, input }) => run(() => service.removePreset(context, input.set, input.key, input))),
    makeDefault: base.input(inputs.change.extend({ set: z.string(), key: z.string() })).handler(({ context, input }) => run(() => service.makeDefault(context, input.set, input.key, input))),
    assignments: base.input(set.extend({ subject: z.string().optional() })).handler(({ context, input }) => run(() => service.assignments(context, input.set, input.subject))),
    assign: base.input(inputs.assign.extend({ set: z.string(), subject: z.string(), slot: z.string() })).handler(({ context, input }) => run(() => service.assign(context, input.set, input.subject, input.slot, input))),
    catalog: base.input(id).handler(({ context, input }) => run(() => service.catalog(context, input.id))),
    addEntry: base.input(inputs.addEntry.extend({ catalog: z.string() })).handler(({ context, input }) => run(() => service.addEntry(context, input.catalog, input))),
    editEntry: base.input(inputs.editEntry.extend({ id: z.string(), entry: z.string() })).handler(({ context, input }) => run(() => service.editEntry(context, input.id, input.entry, input))),
    retire: base.input(entry.extend(inputs.change.shape)).handler(({ context, input }) => run(() => service.retire(context, input.id, input.entry, input))),
    reinstate: base.input(entry.extend(inputs.change.shape)).handler(({ context, input }) => run(() => service.reinstate(context, input.id, input.entry, input)))
  }
}

export type TunablesRouter<Context extends Record<PropertyKey, any> = Record<PropertyKey, never>> = ReturnType<typeof tunablesRouter<Context>>
