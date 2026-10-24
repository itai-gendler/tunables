import express, { type Request } from 'express'
import { createTunables, memoryStore } from '../../src/index.js'
import { tunablesMiddleware } from '../../src/server/express.js'
import { catalogs, effects, groups, presets, scopeLabel, scopes } from '../tasklane/tunables.js'
import { mayUse, people, scopeOf } from '../tasklane/access.js'

/**
 * Tasklane on Express. Its own routes read settings for whoever asks, at their
 * scope; tunables' API is mounted beside them for the settings screens, and
 * decides access through Tasklane's own policy.
 */
export async function createApp() {
  const tunables = createTunables({ store: memoryStore(), groups, presets, catalogs, effects, scopes, scopeLabel })
  await tunables.sync()
  await tunables.presets('plans').assign('acme', 'plan', 'pro')

  // Stands in for the app's session: who is signed in, from a header.
  const personOf = (req: Request) => people[req.get('x-person') ?? '']

  const app = express()
  app.use(express.json())

  // The app's own route: a person never touches tunables' API to be bound by it.
  app.post('/projects', async (req, res) => {
    const person = personOf(req)
    if (!person) return void res.status(401).end()
    const limits = await tunables.get('limits', { scope: scopeOf(person) })
    const open = Number(req.body?.open ?? 0)
    if (open >= limits.maxProjects) return void res.status(409).json({ error: `Your workspace may have ${limits.maxProjects} open projects.` })
    res.status(201).json({ created: true })
  })

  app.use(tunablesMiddleware({
    tunables,
    actor: req => personOf(req) && { id: personOf(req)!.id, name: personOf(req)!.name },
    authorize: (req, { target }) => mayUse(personOf(req), target)
  }))
  return { app, tunables }
}
