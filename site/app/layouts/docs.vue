<script setup lang="ts">
// The sidebar lives in the layout, not in `pages/docs/[...slug].vue`. Nuxt keys a
// page component by its path, so every docs link remounts the page, and an
// aside inside it would be rebuilt, losing its scroll offset on each click.
// Layouts are keyed by name, so this one stays mounted for the whole visit.
const { navigation } = await useDocsNavigation()
</script>

<template>
  <NuxtLayout name="default">
    <UContainer>
      <UPage>
        <template #left>
          <UPageAside>
            <UContentNavigation :navigation="navigation" highlight />
          </UPageAside>
        </template>

        <slot />
      </UPage>
    </UContainer>
  </NuxtLayout>
</template>
