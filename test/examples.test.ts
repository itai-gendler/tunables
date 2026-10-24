import type { AddressInfo } from 'node:net'
import { describe, expect, it } from 'vitest'
import { createApp as expressApp } from '../examples/express/app.js'
import { createApp as honoApp } from '../examples/hono/app.js'

/** The examples run as they are documented: the app's routes and tunables' API side by side. */
describe('Tasklane on Express', () => {
  it('binds a person through the app\'s own route, and lets an owner lower their workspace\'s limit', async () => {
    const { app } = await expressApp()
    const server = app.listen(0)
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const as = (person: string, init: RequestInit = {}) => ({ ...init, headers: { 'content-type': 'application/json', 'x-person': person } })
    try {
      expect((await fetch(`${base}/projects`, as('dana', { method: 'POST', body: JSON.stringify({ open: 10 }) }))).status).toBe(201)

      const lowered = await fetch(`${base}/api/tunables/groups/limits`, as('olivia', { method: 'PUT', body: JSON.stringify({ values: { maxProjects: 10 }, scope: { workspace: 'acme' } }) }))
      expect((await lowered.json()).saved).toBe(true)
      const refused = await fetch(`${base}/projects`, as('dana', { method: 'POST', body: JSON.stringify({ open: 10 }) }))
      expect(refused.status).toBe(409)
      expect((await refused.json()).error).toBe('Your workspace may have 10 open projects.')

      expect((await fetch(`${base}/api/tunables/groups/limits`, as('olivia'))).status).toBe(404)
      expect((await fetch(`${base}/api/tunables/groups/limits`, as('sam'))).status).toBe(200)
    } finally {
      server.close()
    }
  })
})

describe('Tasklane on Hono', () => {
  it('reads a person\'s own settings in the app\'s route, after they set them through the API', async () => {
    const { app } = await honoApp()
    const as = (person: string, init: RequestInit = {}) => ({ ...init, headers: { 'content-type': 'application/json', 'x-person': person } })
    expect(await (await app.request('/me/calendar', as('dana'))).json()).toEqual({ weekStartsOn: 1, defaultView: 'list' })

    const saved = await app.request('/api/tunables/groups/workspace', as('dana', { method: 'PUT', body: JSON.stringify({ values: { weekStartsOn: 0 }, scope: { workspace: 'acme', user: 'dana' } }) }))
    expect((await saved.json()).saved).toBe(true)
    expect(await (await app.request('/me/calendar', as('dana'))).json()).toEqual({ weekStartsOn: 0, defaultView: 'list' })
    expect(await (await app.request('/me/calendar', as('olivia'))).json()).toEqual({ weekStartsOn: 1, defaultView: 'list' })

    const others = await app.request('/api/tunables/groups/workspace?scope=workspace%3Dacme%3Buser%3Dolivia', as('dana'))
    expect(others.status).toBe(404)
    expect((await app.request('/elsewhere', as('dana'))).status).toBe(404)
  })
})
