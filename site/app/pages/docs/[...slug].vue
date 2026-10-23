<script setup lang="ts">
import type { ContentSurroundLink } from '@nuxt/ui'

definePageMeta({ layout: 'docs' })

const route = useRoute()

const { data: page } = await useAsyncData(`docs-page-${route.path}`, () =>
  queryCollection('docs').path(route.path).first())

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { docs } = await useDocsNavigation()

// Previous and next follow the sidebar's order, across groups.
const surround = computed(() => {
  const ordered = docs.value ?? []
  const index = ordered.findIndex(doc => doc.path === route.path)
  if (index === -1) return [null, null] as unknown as ContentSurroundLink[]
  return [ordered[index - 1] ?? null, ordered[index + 1] ?? null] as unknown as ContentSurroundLink[]
})

const title = computed(() => page.value ? `${page.value.title} · tunables docs` : 'tunables docs')

const editURL = computed(() => {
  const stem = page.value?.stem?.replace(/^docs\//, '')
  return stem ? `${REPOSITORY_URL}/edit/main/docs/${stem}.md` : undefined
})

useSiteSeo({
  title,
  description: () => page.value?.description,
  structuredData: () => page.value && page.value.path !== '/docs'
    ? [breadcrumbList([
        { name: 'Home', path: '/' },
        { name: 'Docs', path: '/docs' },
        { name: page.value.title, path: page.value.path }
      ])]
    : []
})
</script>

<template>
  <!-- Nested inside the layout's `UPage`, which spent 2 of its 10 columns on the
    sidebar; re-gridding the 8 that remain keeps a 2/6/2 split. -->
  <UPage :ui="{ root: 'lg:grid-cols-8', center: 'lg:col-span-6' }">
    <UPageBody>
      <!-- Each doc opens with its own `# Title`, so it reads the same on GitHub
        and in the npm package; the page adds only the group it belongs to. -->
      <p class="mb-3 font-mono text-xs uppercase tracking-[0.12em] text-muted" data-docs-group>
        {{ page?.group }}
      </p>
      <ContentRenderer v-if="page" :value="page" class="docs-prose" />
      <USeparator class="my-10" />
      <UContentSurround :surround="surround" />
    </UPageBody>

    <template #right>
      <UContentToc
        v-if="page?.body?.toc?.links?.length"
        :links="page.body.toc.links"
        highlight
        title="On this page"
      >
        <template #bottom>
          <USeparator v-if="editURL" type="dashed" class="my-4" />
          <ULink
            v-if="editURL"
            :to="editURL"
            target="_blank"
            class="flex items-center gap-1.5 text-sm text-muted hover:text-highlighted"
          >
            <UIcon name="i-lucide-pencil" class="size-3.5" aria-hidden="true" />
            Edit this page on GitHub
          </ULink>
        </template>
      </UContentToc>
    </template>
  </UPage>
</template>
