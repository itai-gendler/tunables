<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
// No `Home`: the lockup already links there.
const items = computed<NavigationMenuItem[]>(() => [
  { label: 'Docs', to: '/docs', active: route.path === '/docs' || (route.path.startsWith('/docs/') && route.path !== '/docs/quickstart') },
  { label: 'Quickstart', to: '/docs/quickstart' },
  { label: 'Changelog', to: '/changelog' }
])

const headerUi = {
  container: 'lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]',
  left: 'shrink-0 lg:flex-none',
  right: 'shrink-0 gap-0.5 lg:flex-none lg:justify-end'
}

// Read from the root package.json at build time; see `nuxt.config.ts`.
const { tunablesVersion } = useRuntimeConfig().public

// A star count is decoration, not part of the document: the browser asks
// GitHub once per visit, when idle, and shows nothing if GitHub does not answer.
const stars = useState<number | null>('github-stars', () => null)
onMounted(() => {
  if (stars.value !== null) return
  runWhenIdle(() => {
    void fetchGithubStars().then((count) => { stars.value = count })
  })
})
const githubStars = computed(() => {
  const count = stars.value
  return typeof count === 'number' && count > 0 ? formatStarCount(count) : null
})
const githubLabel = computed(() => githubStars.value ? `tunables on GitHub, ${githubStars.value} stars` : 'tunables on GitHub')
</script>

<template>
  <UHeader :ui="headerUi" data-site-header>
    <template #default>
      <UNavigationMenu
        data-primary-navigation
        :items="items"
        variant="link"
      />
    </template>

    <template #left>
      <div class="flex items-center gap-2.5">
        <NuxtLink to="/" class="flex shrink-0 items-center rounded-md" aria-label="tunables home">
          <BrandLockup compact-on-mobile />
        </NuxtLink>
        <!-- Outside the home link, so the link reads "tunables home" rather
          than swallowing a version number. -->
        <UBadge
          color="neutral"
          variant="outline"
          size="sm"
          data-tunables-version
          class="shrink-0 rounded-full font-mono text-[11px] leading-none tracking-tight"
        >
          <span class="sr-only">tunables version {{ tunablesVersion }}</span>
          <span aria-hidden="true">v{{ tunablesVersion }}</span>
        </UBadge>
      </div>
    </template>

    <template #right>
      <LandingDocsSearchButton class="hidden sm:inline-flex" />
      <UButton
        to="https://github.com/itai-gendler/tunables"
        external
        target="_blank"
        color="neutral"
        variant="ghost"
        :aria-label="githubLabel"
        data-github-link
      >
        <UIcon name="i-simple-icons-github" class="size-4.5 shrink-0" />
        <span v-if="githubStars" class="hidden font-mono text-xs text-highlighted xl:inline">{{ githubStars }}</span>
      </UButton>
      <UColorModeButton
        color="neutral"
        variant="ghost"
        class="hidden lg:inline-flex"
      />
      <UButton
        label="Get started"
        to="/docs/quickstart"
        class="ml-1 hidden xl:flex"
      />
    </template>

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" />

      <div class="mt-4 flex items-center gap-1 border-t border-default pt-4">
        <LandingDocsSearchButton />
        <UColorModeButton color="neutral" variant="ghost" />
      </div>

      <div class="mt-4 grid gap-2">
        <UButton label="Get started" to="/docs/quickstart" block />
      </div>

      <div v-if="route.path.startsWith('/docs')" class="mt-6 border-t border-default pt-6">
        <LazyLandingDocsMobileNavigation />
      </div>
    </template>
  </UHeader>
</template>
