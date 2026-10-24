<script setup lang="ts">
useHead({ title: 'All settings' })
</script>

<template>
  <section>
    <header class="border-b border-default pb-4">
      <h2 class="text-lg font-semibold text-highlighted">
        All settings
      </h2>
      <p class="mt-1 max-w-prose text-sm text-muted">
        Every setting for the whole system, with its value and default. Each is edited beside what it affects.
      </p>
    </header>
    <TunablesOverview class="mt-4" />
  </section>
</template>
