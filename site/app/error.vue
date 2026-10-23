<script setup lang="ts">
import type { NuxtError } from '#app'

/**
 * The site's own error page, inside the default layout, so a visitor who
 * mistypes a URL still sees the header, the footer and the way back.
 */
const { error } = defineProps<{ error: NuxtError }>()

const route = useRoute()
const notFound = computed(() => error.statusCode === 404)
const title = computed(() => notFound.value ? 'Page not found' : 'Something went wrong')
const documentTitle = computed(() => notFound.value ? NOT_FOUND_TITLE : `${title.value} · tunables`)

useSiteSeo({
  title: documentTitle,
  description: () => notFound.value
    ? 'Nothing lives at this address on tunables.dev.'
    : 'This page could not be loaded.'
})
useSeoMeta({ robots: 'noindex' })

// A static host answers an unknown URL with the generated 404.html shell, which
// starts in the error state and never writes head tags, so set the title here.
onMounted(() => {
  document.title = documentTitle.value
})

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <!-- Error pages do not render app.vue, so they need their own UApp. -->
  <UApp>
    <NuxtLayout>
      <section class="px-4 py-20 sm:px-6 sm:py-28">
        <div class="mx-auto max-w-xl">
          <h1 class="text-4xl font-semibold tracking-[-0.04em] text-highlighted sm:text-5xl">
            {{ title }}
          </h1>
          <p class="mt-5 text-base leading-relaxed text-muted">
            <template v-if="notFound">
              Error {{ error.statusCode }}: nothing lives at
              <code class="font-mono text-sm text-highlighted [overflow-wrap:anywhere]">{{ route.path }}</code>.
            </template>
            <template v-else>
              Error {{ error.statusCode }}. Try again in a moment.
            </template>
          </p>
          <div class="mt-8 flex flex-wrap items-center gap-3">
            <UButton label="Go to the home page" size="lg" @click="goHome" />
            <UButton
              label="Read the docs"
              to="/docs"
              color="neutral"
              variant="outline"
              size="lg"
            />
          </div>
        </div>
      </section>
    </NuxtLayout>
  </UApp>
</template>
