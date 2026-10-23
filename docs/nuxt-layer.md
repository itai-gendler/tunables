---
title: The Nuxt layer
description: Ready screens for a Nuxt UI app — a group's form, All settings, history, presets, assignments and catalogs — placed beside what they affect.
group: Screens
order: 13
---

# The Nuxt layer

`tunables/nuxt` is a Nuxt layer with the screens an administrator needs, built
on Nuxt UI. Extend it, and its components are available on every page of your
app, in your app's own theme.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  extends: ['tunables/nuxt'],
  modules: ['@nuxt/ui']
})
```

It needs `nuxt` 4.4 or later and `@nuxt/ui` 4.9 or later in your app, and the
API mounted in your server: see [Server and access](./server.md). Tailwind has
to see the layer's components to generate their classes; see
[Theming](./theming.md#let-tailwind-see-the-components).

## Where the screens go

Put each group's form on the page beside what it affects, not on one settings
page: collection settings on the Feeds screens, reader limits on the Readers
screens. A group's `place` names that page, so All settings can link to it.
The screens never decide who may see them: guard each page with your own admin
route middleware, and the API with `authorize`.

## The components

| Component | Props | Shows |
| --- | --- | --- |
| `TunablesGroupForm` | `group`, `history?` | One group's form |
| `TunablesOverview` | none | All settings, read-only |
| `TunablesHistory` | `target` | A target's revisions, with restore for groups |
| `TunablesPresets` | `set` | A preset set, by slot |
| `TunablesAssign` | `set`, `subject`, `slot`, `label?` | The preset one subject follows for one slot |
| `TunablesCatalog` | `catalog` | A catalog's entries |
| `TunablesFieldHint` | `label`, `help?`, `defaultDisplay?` | The question mark beside a label, for your own forms |

### TunablesGroupForm

```vue [app/pages/admin/feeds/settings.vue]
<template>
  <TunablesGroupForm group="collection" />
</template>
```

One group, edited as a whole:

- every field under its section, with a section menu when there are several;
- each field's label, its explanation and default behind a question mark, what
  changing it affects, and the group's [notes](./checks-and-guards.md#notes);
- the input its [kind](./kinds-and-units.md) calls for, a mark on each unsaved
  change, and a way back to the default;
- one bar for the unsaved changes, with a reason that is kept in the history,
  Discard and Save;
- each problem beside the field it is about, and the rest above the form;
- a dialog for a change that asks to be [confirmed](./checks-and-guards.md#confirmations-for-costly-changes);
- the group's history in a side panel, with restore. Pass `:history="false"`
  to leave it out.

Leaving the page with unsaved changes asks first, by link or by closing the
tab.

### TunablesOverview

```vue [app/pages/admin/settings.vue]
<template>
  <TunablesOverview />
</template>
```

All settings on one page: every field of every group, its value beside its
default, what it affects, and a link to where it is edited. Find a setting by
name, filter by what it affects, or show only what differs from the defaults.
It is read-only; changes happen on each group's own form.

### TunablesHistory

```vue
<TunablesHistory :target="{ kind: 'preset', name: 'run-configs', id: 'weekly' }" />
```

Revisions newest first, a page at a time: who, when, why, and each value
before and after, as it reads. A group's revisions can be restored, through
the same checks as a save. It emits `restored`.

### TunablesPresets and TunablesAssign

```vue [app/pages/admin/run-configs/index.vue]
<template>
  <TunablesPresets set="run-configs" />
</template>
```

A preset set by slot: each preset, which is the default, how many subjects are
assigned it, and its history; create, edit, make default and remove.

`TunablesAssign` goes where your app shows a subject, such as a reader's page:

```vue
<TunablesAssign set="run-configs" :subject="reader.id" slot="daily" label="Daily Run Config" />
```

It offers *Follow the default* and every preset in the slot, and emits
`changed` with the key chosen, or `null` for the default.

### TunablesCatalog

```vue [app/pages/admin/run-configs/models.vue]
<template>
  <TunablesCatalog catalog="models" />
</template>
```

Every entry with its state and what uses it; add, edit, retire and reinstate.
An entry in use cannot be retired, and the screen says by what.

## Another client

The screens call the API through a client. By default the layer provides
`fetchClient` at `appConfig.tunables.baseURL`, which is `/api/tunables`:

```ts [app/app.config.ts]
export default defineAppConfig({
  tunables: { baseURL: '/admin/api/tunables' }
})
```

To call tunables through your oRPC router instead, set `baseURL: false` and
provide the client from a plugin of your own:

```ts [app/app.config.ts]
export default defineAppConfig({
  tunables: { baseURL: false }
})
```

```ts [app/plugins/tunables.ts]
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { orpcClient } from 'tunables/client'
import { TUNABLES_CLIENT } from 'tunables/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const origin = import.meta.server ? useRequestURL().origin : window.location.origin
  const link = new RPCLink({ url: `${origin}/rpc`, headers: () => import.meta.server ? useRequestHeaders(['cookie']) : {} })
  const client = createORPCClient<{ tunables: Record<string, (input?: unknown) => Promise<unknown>> }>(link)
  nuxtApp.vueApp.provide(TUNABLES_CLIENT, orpcClient(client.tunables))
})
```

`orpcClient` takes the `tunables` branch of your oRPC client, wherever you
nested `tunablesRouter`.

## Your own screens

The components are built on the [Vue composables](./vue-composables.md). When a
screen needs to look different, build it on those, and keep
`TunablesFieldHint` for the explanation beside each label.
