<script setup lang="ts">
useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    // The page backgrounds (`--ui-bg` in assets/css/main.css), per color scheme.
    { name: 'theme-color', content: '#f6f8f8', media: '(prefers-color-scheme: light)' },
    { name: 'theme-color', content: '#0d1316', media: '(prefers-color-scheme: dark)' }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }
  ]
})

useSiteSeoDefaults()
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator color="var(--ui-primary)" />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
