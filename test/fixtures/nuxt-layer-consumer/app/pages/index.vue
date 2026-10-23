<script setup lang="ts">
import { useGroupForm } from 'tunables/vue'

const form = useGroupForm('run')
const dirty: boolean = form.dirty.value
</script>

<template>
  <main>
    <TunablesGroupForm group="run" />
    <TunablesOverview />
    <TunablesPresets set="run-configs" />
    <TunablesAssign set="run-configs" subject="reader-1" slot="daily" />
    <TunablesCatalog catalog="models" />
    <TunablesHistory :target="{ kind: 'group', name: 'run' }" />
    <p v-if="dirty">
      Unsaved
    </p>
  </main>
</template>
