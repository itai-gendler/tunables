<script setup lang="ts">
/**
 * The lockup the header and footer show: the dial mark and the name, always
 * lowercase. The wordmark is live text in the heading face, not an image, so it
 * follows the color mode and stays selectable.
 */
const { compactOnMobile = false } = defineProps<{
  /** Drop the wordmark on the narrowest phones, keeping the mark as the home link. */
  compactOnMobile?: boolean
}>()
</script>

<template>
  <span class="flex shrink-0 items-center gap-2 text-highlighted">
    <BrandMark :size="28" />
    <span
      data-brand-wordmark
      class="font-[family-name:var(--site-font-heading)] text-[1.2rem] font-semibold leading-none tracking-[-0.03em]"
      :class="compactOnMobile ? 'max-[359px]:sr-only' : undefined"
    >tunables</span>
  </span>
</template>
