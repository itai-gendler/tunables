---
title: Vue composables
description: Headless composables for building tunables' screens in any Vue app, on any design system.
group: Screens
order: 14
---

# Vue composables

`tunables/vue` holds what a form, a history or a catalog screen needs, with no
markup: state, drafts, problems and the calls that change things. The Nuxt
layer's screens are built on these; build your own on them when you use
another design system, or Vue without Nuxt.

## Providing a client

Every composable calls tunables through the client provided above it. Provide
one once, in your root component:

```ts
import { fetchClient } from 'tunables/client'
import { provideTunables } from 'tunables/vue'

provideTunables(fetchClient({ baseURL: '/api/tunables' }))
```

Or at the app level, with the injection key:

```ts
import { createApp } from 'vue'
import { fetchClient } from 'tunables/client'
import { TUNABLES_CLIENT } from 'tunables/vue'

createApp(App).provide(TUNABLES_CLIENT, fetchClient()).mount('#app')
```

`fetchClient` takes a `baseURL` (`/api/tunables` by default), a `fetch` of your
own, `headers` for every request (an object or a function, such as one that
adds a CSRF token) and `credentials` (`same-origin` by default). `orpcClient`
does the same over an oRPC client; see
[The Nuxt layer](./nuxt-layer.md#another-client).

A request the server refused or could not answer throws a
`TunablesClientError` with its `status`. A refused *change* does not throw: it
comes back with its `problems`.

## useGroupForm

One group's form.

```vue
<script setup lang="ts">
import { useGroupForm, useUnloadGuard } from 'tunables/vue'

const form = useGroupForm('readers')
useUnloadGuard(form.dirty)
</script>

<template>
  <form v-if="form.group.value" @submit.prevent="form.save()">
    <label v-for="field in form.group.value.fields" :key="field.key">
      {{ field.label }}
      <input v-model.number="form.draft[field.key]" type="number">
      <small v-for="problem in form.fieldProblems(field.key)" :key="problem">{{ problem }}</small>
    </label>
    <input v-model="form.reason.value" placeholder="Why">
    <button :disabled="!form.dirty.value || form.saving.value">
      Save
    </button>
    <p v-if="form.confirm.value">
      {{ form.confirm.value }}
      <button type="button" @click="form.confirmAndSave()">
        Save anyway
      </button>
    </p>
  </form>
</template>
```

| Returns | What it is |
| --- | --- |
| `group` | The group's description: title, sections, fields with labels, help, units and defaults. |
| `entry` | The stored entry. |
| `draft` | A reactive copy of the values, to bind inputs to. |
| `dirty`, `dirtyKeys` | Whether, and which, fields differ from what is stored. |
| `problems`, `fieldProblems(key)`, `generalProblems` | What the last save answered, all, per field, or about the whole change. |
| `confirm` | The question the last save asked, if any. |
| `reason` | The reason to send with the save. |
| `save()`, `confirmAndSave()`, `cancelConfirm()` | Save the changed fields; send them again confirmed; drop the question. |
| `isDefault(field)`, `toDefault(field)`, `discard()` | Check a field against its default; put its draft back to it; drop every unsaved change. |
| `loading`, `saving`, `error`, `lastSaved`, `refresh()` | State, the last outcome, and a reload. |

`save` sends only the fields that changed, and resolves to whether they were
saved.

## The others

| Composable | Gives |
| --- | --- |
| `useTunablesDescription()` | `description` of every group, preset set and catalog, fetched once per client; `error`, `pending`, `refresh()`. |
| `useOverview()` | `entries` of every group, for All settings; `loading`, `error`, `refresh()`. |
| `useHistory(target, { pageSize })` | `revisions` newest first, `more`, `loadMore()`, `refresh()`, and `restore(revision, { reason, confirmed })`. |
| `usePresets(set)` | `presets` with how many are assigned each; `create`, `update`, `remove`, `makeDefault`, `assign`, `assignments`. |
| `useCatalog(catalog)` | `entries` with what uses each, `available`; `add`, `edit`, `retire`, `reinstate`. |
| `useUnloadGuard(dirty)` | Asks before the page unloads while `dirty` is true. Add your router's own leave guard beside it. |
| `useTunablesClient()` | The provided client, for anything the composables do not cover. |

Each composable that takes an id also takes a ref, and reloads when it
changes. Each change resolves to its outcome and refreshes the list when it
was saved.

`displayValue(field, value)` reads a value the way the server does, from the
field's description, for a value still being edited.
