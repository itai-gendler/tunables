<script setup lang="ts">
useHead({ htmlAttrs: { lang: 'en' }, titleTemplate: title => title ? `${title} · news administration` : 'news administration' })
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
