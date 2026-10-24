import { Hono } from 'hono'
import { createTunables, memoryStore } from '../../src/index.js'
import { createHandler } from '../../src/server/index.js'
import { catalogs, effects, groups, presets, scopeLabel, scopes } from '../tasklane/tunables.js'
import { mayUse, people, scopeOf, type Person } from '../tasklane/access.js'

/**
 * Tasklane on Hono, or anything that speaks web-standard Requests: the fetch
 * handler answers under its base path, and the app's routes go on as before.
 */
export async function createApp() {
  const tunables = createTunables({ store: memoryStore(), groups, presets, catalogs, effects, scopes, scopeLabel })
  await tunables.sync()
  await tunables.presets('plans').assign('acme', 'plan', 'pro')

  const handle = createHandler<Person | undefined>({
    tunables,
    actor: person => person && { id: person.id, name: person.name },
    authorize: (person, { target }) => mayUse(person, target)
  })

  const app = new Hono()

  // The app's own route: what a person's week looks like, from their own settings.
  app.get('/me/calendar', async (c) => {
    const person = people[c.req.header('x-person') ?? '']
    if (!person) return c.body(null, 401)
    const { weekStartsOn, defaultView } = await tunables.get('workspace', { scope: scopeOf(person) })
    return c.json({ weekStartsOn, defaultView })
  })

  app.all('/api/tunables/*', async c => (await handle(c.req.raw, people[c.req.header('x-person') ?? ''])) ?? c.notFound())
  return { app, tunables }
}
