---
title: Quickstart
description: Take one group of settings from constants to a screen with a history, in a Nuxt app on Postgres.
group: Get started
order: 2
---

# Quickstart

This takes one group of settings from constants in your code to a screen in
your app, stored in your Postgres, with every change recorded. It assumes a
Nuxt 4 app with Nuxt UI and a Postgres database reached through `pg`. Other
servers, drivers and UIs are covered in [Server and access](./server.md),
[Storage](./storage.md) and [Vue composables](./vue-composables.md).

## 1. Install

```bash
npm install tunables pg
```

tunables needs Node.js 22.12 or later. Its framework integrations are optional
peer dependencies: install only the ones your app uses. A Nuxt app already has
`nuxt`, `@nuxt/ui` and `vue`.

## 2. Declare a group

A group is a set of settings edited together, on one form, beside what they
affect. Put your definitions in a module that imports nothing that connects,
because both your app and the CLI load it.

```ts [server/settings.ts]
import { defineGroup, number, toggle } from 'tunables'

export const readers = defineGroup({
  id: 'readers',
  title: 'Reader Limits',
  description: 'What each reader keeps, and how often they may ask for work the product pays for.',
  place: { label: 'Readers › Limits', href: '/admin/readers/limits' },
  fields: {
    briefsPerReader: number({
      label: 'Briefs per reader',
      help: 'How many Briefs one reader may keep.',
      unit: 'count',
      default: 12,
      section: 'What a reader keeps'
    }),
    siteChecksPerHour: number({
      label: 'Site checks an hour',
      help: 'How often one reader may ask to check a site.',
      unit: 'count',
      default: 30,
      section: 'How often a reader may ask'
    }),
    invitesOpen: toggle({
      label: 'Invitations open',
      help: 'Whether readers may invite others.',
      default: true
    })
  }
})

export const groups = [readers] as const
```

Each field states its kind (`number`, `toggle`, and [six more](./kinds-and-units.md)),
its default and its explanation. The default lives here and nowhere else.

## 3. Store it in your Postgres

Create the app's tunables over the client you already have. `createTunables`
checks the definitions and never connects, and a `pg.Pool` opens its first
connection on its first query, so boot stays free of the database.

```ts [server/tunables.ts]
import pg from 'pg'
import { createTunables } from 'tunables'
import { fromPg, postgresStore } from 'tunables/postgres'
import { groups } from './settings'

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

export const tunables = createTunables({
  store: postgresStore(fromPg(pool)),
  groups
})
```

tunables keeps four tables in a schema called `tunables`. Create them in your
deploy step with `migrate`, which is safe to run every time, or put
`tunablesSql()` or the [Drizzle tables](./storage.md#drizzle) in your own
migrations.

## 4. Seed the values

The CLI reads `tunables.config.ts`. Its `connect` hands the CLI your app's
tunables; here it also creates the tables, so one command sets everything up.

```ts [tunables.config.ts]
import { defineConfig } from 'tunables/config'
import { fromPg, migrate } from 'tunables/postgres'
import { groups } from './server/settings'
import { pool, tunables } from './server/tunables'

export default defineConfig({
  groups,
  async connect() {
    await migrate(fromPg(pool))
    return tunables
  },
  async disconnect() {
    await pool.end()
  }
})
```

```bash
npx tunables sync
```

```
✓ seeded readers with its defaults
```

`sync` stores each new group at its defaults, as a revision. Run it in every
deploy, after the tables exist and before the new code serves: a group that
was never synced cannot be read.

## 5. Read a setting

Read at the point of use, every time. A read is one query and returns typed
values: `briefsPerReader` is a `number` here.

```ts
const { briefsPerReader } = await tunables.get('readers')
if (briefs.length >= briefsPerReader) {
  throw createError({ statusCode: 409, message: `A reader keeps at most ${briefsPerReader} Briefs.` })
}
```

There is no fallback to write: `get` returns every field, or throws
`TunablesMissing` when `sync` has not run.

## 6. Mount the API

The screens talk to one handler. It answers paths under `/api/tunables` and
asks your app, on every request, who is asking and whether they may.

```ts [server/routes/api/tunables/[...].ts]
import type { H3Event } from 'h3'
import { createHandler } from 'tunables/server'
import { tunables } from '../../../tunables'

const handle = createHandler<H3Event>({
  tunables,
  // Who is asking, from your own sign-in. Undefined when nobody is signed in.
  actor: (event) => {
    const user = event.context.user
    return user ? { id: user.id, name: user.name } : undefined
  },
  // Whether they may. Without it, nothing is allowed.
  authorize: (event, { action }) =>
    action === 'read' ? Boolean(event.context.user?.staff) : event.context.user?.role === 'admin'
})

export default defineEventHandler(async event =>
  (await handle(toWebRequest(event), event)) ?? createError({ statusCode: 404 }))
```

`event.context.user` stands for whatever your auth sets; tunables has no users
of its own. A refused request answers 404 by default, so an outsider cannot
tell the administration exists.

## 7. Embed the screens

Extend the layer, and let Tailwind see its components:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  extends: ['tunables/nuxt'],
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css']
})
```

```css [app/assets/css/main.css]
@import "tailwindcss";
@import "@nuxt/ui";

@source "../../../node_modules/tunables/layers/nuxt/tunables/app";
```

Then put the form on the page beside what it affects, behind your own admin
route guard:

```vue [app/pages/admin/readers/limits.vue]
<template>
  <TunablesGroupForm group="readers" />
</template>
```

The form shows each field by section with its explanation and default, saves
the whole group at once, shows each problem beside the field it is about, and
lists the group's history with a way to restore. Add an All settings page with
`<TunablesOverview />`.

## 8. Change it, and read the history

Change a value on the screen, or from a terminal:

```bash
npx tunables set readers briefsPerReader=6 --reason "Fewer while we test"
npx tunables history readers
```

```
Saved as revision 2.
#2  2026-10-23T09:12:44.021Z  ada (terminal)  “Fewer while we test”
    briefsPerReader: 12 → 6
#1  2026-10-23T09:02:10.518Z  ada (terminal)  “Seeded with the defaults.”
    briefsPerReader: null → 12; siteChecksPerHour: null → 30; invitesOpen: null → true
```

## Next

- Add [rules, guards and confirmations](./checks-and-guards.md) so a change
  cannot break what depends on it.
- Move environment variables that are really deployment values into
  [deployment values](./deployment-values.md), and the rest into groups.
- Install the [agent skills](./skills.md) and let your coding agent adopt the
  rest of your app's settings.
