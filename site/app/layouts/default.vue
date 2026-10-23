<script setup lang="ts">
import LandingFooter from '~/components/landing/Footer.vue'
import LandingHeader from '~/components/landing/Header.vue'
</script>

<template>
  <div class="min-h-dvh">
    <LandingHeader />
    <main class="min-h-[calc(100dvh-var(--ui-header-height))]">
      <slot />
    </main>
    <LandingFooter />
    <ClientOnly>
      <LazyLandingDocsSearch />
    </ClientOnly>
  </div>
</template>
