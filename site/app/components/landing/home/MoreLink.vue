<script setup lang="ts">
import type { HomeLink } from '~/utils/homeContent'

/**
 * Where a section continues, in the section's corner: a label on the box, not
 * an offer inside it. External links (pdd-kit.dev) open in a new tab.
 */
const { link } = defineProps<{ link: HomeLink }>()
const external = computed(() => /^https?:/.test(link.to))
</script>

<template>
  <ULink
    :to="link.to"
    :target="external ? '_blank' : undefined"
    class="inline-flex w-fit items-center gap-1.5 rounded-sm font-mono text-xs uppercase tracking-[0.12em] text-muted transition-colors hover:text-highlighted focus-visible:text-highlighted"
  >
    {{ link.label }}
    <UIcon :name="external ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-right'" class="size-3.5" aria-hidden="true" />
  </ULink>
</template>
