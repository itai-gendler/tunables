<script setup lang="ts">
useHead({ title: 'Workspace settings' })
/** What Acme's owner sets for everyone in Acme, within its plan. */
const acme = { workspace: 'acme' }
const tabs = [{ label: 'How Acme works', value: 'workspace', slot: 'workspace' }, { label: 'Limits', value: 'limits', slot: 'limits' }]
</script>

<template>
  <UTabs :items="tabs" default-value="workspace" variant="link" :unmount-on-hide="false">
    <template #workspace>
      <TunablesGroupForm group="workspace" :scope="acme" class="mt-4" />
    </template>
    <template #limits>
      <TunablesGroupForm group="limits" :scope="acme" class="mt-4" />
    </template>
  </UTabs>
</template>
