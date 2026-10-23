<script setup lang="ts">
// Client-only and lazy: the search index is fetched in the browser the first
// time this mounts, never baked into every page's payload.
const { navigation } = await useDocsNavigation()
const { data: searchFiles } = useLazyAsyncData('docs-search', () =>
  queryCollectionSearchSections('docs'), { server: false })
</script>

<template>
  <span hidden data-docs-search-ready />
  <LazyUContentSearch
    :files="searchFiles ?? []"
    :navigation="navigation"
    shortcut="meta_k"
    placeholder="Search the docs"
  />
</template>
