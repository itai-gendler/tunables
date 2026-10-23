<script setup lang="ts">
useHead({ title: 'Readers' })
/** The fixture's readers, each following the default Run Config for a cadence or assigned one. */
const readers = [
  { id: 'reader-ada', name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 'reader-grace', name: 'Grace Hopper', email: 'grace@example.com' }
]
</script>

<template>
  <section>
    <header class="border-b border-default pb-4">
      <h2 class="text-lg font-semibold text-highlighted">
        Readers
      </h2>
      <p class="mt-1 max-w-prose text-sm text-muted">
        Each reader follows the default Run Config for each cadence, or is assigned one.
      </p>
    </header>
    <ul class="mt-4 divide-y divide-default rounded-md border border-default">
      <li v-for="reader in readers" :key="reader.id" class="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div>
          <p class="font-medium text-highlighted">
            {{ reader.name }}
          </p>
          <p class="text-xs text-muted">
            {{ reader.email }}
          </p>
        </div>
        <TunablesAssign set="run-configs" :subject="reader.id" slot="daily" label="Daily Run Config" />
        <TunablesAssign set="run-configs" :subject="reader.id" slot="weekly" label="Weekly Run Config" />
      </li>
    </ul>
  </section>
</template>
