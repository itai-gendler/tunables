<script setup lang="ts">
useHead({ title: 'My settings' })
/** What Dana sets for herself in Acme; the rest she inherits from Acme and the system. */
const dana = { workspace: 'acme', user: 'dana' }
const tabs = [{ label: 'Preferences', value: 'workspace', slot: 'workspace' }, { label: 'AI suggestions', value: 'limits', slot: 'limits' }]
</script>

<template>
  <UTabs :items="tabs" default-value="workspace" variant="link" :unmount-on-hide="false">
    <template #workspace>
      <TunablesGroupForm group="workspace" :scope="dana" class="mt-4" />
    </template>
    <template #limits>
      <TunablesGroupForm group="limits" :scope="dana" class="mt-4" />
    </template>
  </UTabs>
</template>
