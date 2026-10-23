---
title: Testing
description: Your app's tunables in memory for its own tests, with values set where a test needs them, and how to test rules, guards and confirmations.
group: Integrate
order: 12
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
import { catalogs, effects, groups, presets, units } from '../server/settings'

describe('reader limits', () => {
  it('starts every reader at twelve Briefs', async () => {
    const tunables = await testTunables({ groups, presets, catalogs, units, effects })
    expect((await tunables.get('readers')).briefsPerReader).toBe(12)
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
value that fails its field's check, makes `setForTest` throw.

```ts
import { setForTest, testTunables } from 'tunables/testing'

const tunables = await testTunables({ groups })
await setForTest(tunables, { readers: { briefsPerReader: 1 } })

await expect(createBrief(reader, tunables)).rejects.toThrow('A reader keeps at most 1 Briefs.')
```

## Testing your checks

Test each rule, guard and confirmation through `save`, the way a person meets
it: refused with its problem, or asked, then saved once confirmed.

```ts
import { feedsWithinBounds } from '../server/guards'

it('refuses to lower the article bound below a Feed', async () => {
  const tunables = await testTunables({ groups, guards: { collection: [feedsWithinBounds] } })
  const outcome = await tunables.save('collection', { maxArticlesPerRetrieval: 200 })
  expect(outcome.saved).toBe(false)
  expect(outcome.problems[0]?.message).toBe('Feed "Ars Technica" reads 300 articles, above the Most articles per retrieval of 200.')
})

it('asks before a change that redoes Screening', async () => {
  const tunables = await testTunables({ groups })
  const asked = await tunables.save('run', { screeningReasonWords: 20 })
  expect(asked.confirm).toMatch(/redoes every saved Screening judgment/)
  const saved = await tunables.save('run', { screeningReasonWords: 20 }, { confirmed: true })
  expect(saved.saved).toBe(true)
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

const saved = await client.save('readers', { values: { briefsPerReader: 6 }, reason: 'Test' })
expect(saved.revision?.actor).toBe('Ada')
```

## Postgres in tests

The memory store behaves like Postgres for one process: transactions are
serialized and roll back on error. Test `hold` and concurrent changes against
a real database through `postgresStore`, in a schema of their own that each
test creates with `migrate` and drops after.
