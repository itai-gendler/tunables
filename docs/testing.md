---
title: Testing
description: Your app's tunables in memory for its own tests, with values set where a test needs them, and how to test rules, guards and confirmations.
group: Integrate
order: 15
---

# Testing

`tunables/testing` gives your tests your app's own definitions over an
in-memory store: no database, no setup beyond the definitions you already
export.

## testTunables

`testTunables` takes the same options as `createTunables`, without a store,
and returns tunables already synced, so every group reads its defaults.

```ts
import { describe, expect, it } from 'vitest'
import { testTunables } from 'tunables/testing'
import { catalogs, effects, groups, presets, scopes } from '../server/settings'

export const definitions = { groups, presets, catalogs, effects, scopes }

describe('limits', () => {
  it('lets a new workspace open three projects', async () => {
    const tunables = await testTunables(definitions)
    expect((await tunables.get('limits', { scope: { workspace: 'new' } })).maxProjects).toBe(3)
  })
})
```

Pass a `store` to use another one, such as a fresh `memoryStore` with a fixed
clock.

## setForTest

A test often needs to start somewhere the checks would not let a person go in
one step. `setForTest` stores values for a test as they are, past rules,
guards, `within` and confirmations, and records them as a revision by `test`.
Each field's own check still applies: a key the group does not declare, or a
value that fails its field's check, makes `setForTest` throw. It sets system
values; put a workspace's or a person's own values in place with `save` and
its `scope`, or assign a plan with `presets(id).assign`.

```ts
import { setForTest, testTunables } from 'tunables/testing'

const tunables = await testTunables(definitions)
await setForTest(tunables, { limits: { maxProjects: 1 } })

await expect(createProject(workspace, tunables)).rejects.toThrow('A workspace may have 1 open projects.')
```

## Testing your checks

Test each rule, guard and confirmation through `save`, the way a person meets
it: refused with its problem, or asked, then saved once confirmed.

```ts
import { projectsWithinLimit } from '../server/guards'

it('refuses to lower the task limit below a project', async () => {
  const tunables = await testTunables({ ...definitions, guards: { limits: [projectsWithinLimit] } })
  const outcome = await tunables.save('limits', { maxTasksPerProject: 100 })
  expect(outcome.saved).toBe(false)
  expect(outcome.problems[0]?.message).toBe('Project "Launch" has 140 open tasks, above the 100 allowed.')
})

it('asks before turning on Guests', async () => {
  const tunables = await testTunables(definitions)
  const acme = { workspace: 'acme' }
  const asked = await tunables.save('workspace', { guestAccess: true }, { scope: acme })
  expect(asked.confirm).toMatch(/Guests will see every task/)
  const saved = await tunables.save('workspace', { guestAccess: true }, { scope: acme, confirmed: true })
  expect(saved.saved).toBe(true)
})

it('keeps a workspace within its plan', async () => {
  const tunables = await testTunables(definitions)
  await tunables.presets('plans').assign('acme', 'plan', 'pro')
  const outcome = await tunables.save('limits', { maxProjects: 60 }, { scope: { workspace: 'acme' } })
  expect(outcome.problems[0]?.message).toBe('Projects may be at most 50 for Workspace acme, the value it inherits.')
})
```

## Testing your server

`createHandler` is a plain function from a `Request` to a `Response`, so a test
can call it without a server, and `fetchClient` can call it as the screens do:

```ts
import { createHandler } from 'tunables/server'
import { fetchClient } from 'tunables/client'

const handle = createHandler({ tunables, actor: () => 'Ada', authorize: () => true })
const client = fetchClient({
  fetch: async (input, init) => (await handle(new Request(new URL(String(input), 'http://app.test'), init)))
    ?? new Response('Not found', { status: 404 })
})

const saved = await client.save('limits', { values: { maxProjects: 6 }, reason: 'Test' })
expect(saved.revision?.actor).toBe('Ada')
```

## Postgres in tests

The memory store behaves like Postgres for one process: transactions are
serialized and roll back on error. Test `hold` and concurrent changes against
a real database through `postgresStore`, in a schema of their own that each
test creates with `migrate` and drops after.
