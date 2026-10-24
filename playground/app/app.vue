<script setup lang="ts">
useHead({ htmlAttrs: { lang: 'en' }, titleTemplate: title => title ? `${title} · Tasklane` : 'Tasklane' })
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
