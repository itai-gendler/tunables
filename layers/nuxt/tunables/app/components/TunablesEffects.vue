<script setup lang="ts">
import type { Description } from 'tunables/vue'

/** What changing a field changes, each with its icon; costly ones stand out. */
const props = defineProps<{ affects: string[], effects?: Description['effects'] }>()
const items = computed(() => props.affects.map(id => ({ id, ...(props.effects?.[id] ?? { label: id, warn: false }) })))
</script>

<template>
  <ul v-if="items.length" class="flex flex-wrap gap-x-3 gap-y-1 text-xs" aria-label="What this affects">
    <li
      v-for="item in items"
      :key="item.id"
      class="inline-flex items-center gap-1"
      :class="item.warn ? 'font-medium text-default' : 'text-muted'"
    >
      <UIcon v-if="item.icon" :name="item.icon" class="size-3.5" :class="item.warn ? 'text-warning' : ''" />
      {{ item.label }}
    </li>
  </ul>
</template>
