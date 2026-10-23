<script setup lang="ts">
/** The question mark beside a label: what the field means, and its default. */
const props = defineProps<{ label: string, help?: string, defaultDisplay?: string }>()
const open = ref(false)
const text = computed(() => [props.help, props.defaultDisplay ? `Default: ${props.defaultDisplay}.` : undefined].filter(Boolean).join('\n'))
</script>

<template>
  <UTooltip v-if="text" v-model:open="open" :portal="false" :content="{ side: 'top', align: 'start' }">
    <button
      type="button"
      class="inline-flex size-5 items-center justify-center rounded-full text-dimmed hover:text-default focus-visible:outline-2 focus-visible:outline-primary"
      :aria-label="`About ${label}`"
      @click.prevent="open = !open"
    >
      <UIcon name="i-lucide-circle-help" class="size-4" />
    </button>
    <template #content>
      <p class="max-w-80 whitespace-pre-line text-pretty text-xs leading-relaxed">
        {{ text }}
      </p>
    </template>
  </UTooltip>
</template>
