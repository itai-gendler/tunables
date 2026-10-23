<script setup lang="ts">
import type { HomeLink } from '~/utils/homeContent'
import MoreLink from '~/components/landing/home/MoreLink.vue'

/**
 * A section's heading, left-aligned on the page's reading edge, with the corner
 * link that says where the section continues. Every section has one, so a
 * reader who finds it once knows where to look on the next.
 */
const { title, description, more } = defineProps<{
  title: string
  description: string
  more: HomeLink
}>()
</script>

<template>
  <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
    <div class="max-w-2xl">
      <h2 class="text-balance text-3xl font-semibold tracking-[-0.035em] text-highlighted sm:text-4xl">
        {{ title }}
      </h2>
      <p class="mt-4 text-base leading-7 text-default">
        {{ description }}
      </p>
    </div>
    <MoreLink :link="more" class="shrink-0 lg:mb-1.5" />
  </div>
</template>
