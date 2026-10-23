<script setup lang="ts">
import HomeLayout from '~/components/landing/home/HomeLayout.vue'

// Every doc is prerendered. Links inside the home page reach most of them, but
// a crawl is not a promise, so list every doc route from the same collection
// that renders it while the home page is being generated.
if (import.meta.prerender) {
  const docs = await queryCollection('docs').select('path').all()
  prerenderRoutes(docs.map(doc => doc.path))
}

useSiteSeo({
  title: 'tunables · Runtime settings with guardrails',
  socialTitle: 'Runtime settings with guardrails, for the app you already run.',
  description: 'tunables is an open-source TypeScript library for runtime settings: declared once, stored in your Postgres, edited on screens inside your app, checked whole on every save and recorded in a history you can restore from.'
})
</script>

<template>
  <HomeLayout />
</template>
