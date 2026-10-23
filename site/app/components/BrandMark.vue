<script setup lang="ts">
/**
 * The tunables mark: a dial. Eleven ticks over a 270° sweep, a knob, and an
 * indicator turned two-thirds of the way up. Every tunable is a knob on a panel;
 * this is one of them.
 *
 * Drawn inline in `currentColor`, with the indicator in the primary accent, so
 * it takes light and dark from the page and costs no request. The favicon in
 * `public/favicon.svg` is the same drawing.
 */
const { size = 28 } = defineProps<{ size?: number }>()

// Ticks from 135° (lower left) to 405° (lower right), clockwise.
const ticks = Array.from({ length: 11 }, (_, index) => {
  const angle = ((135 + index * 27) * Math.PI) / 180
  const inner = index % 5 === 0 ? 10.6 : 11.4
  return {
    x1: 16 + Math.cos(angle) * inner,
    y1: 16 + Math.sin(angle) * inner,
    x2: 16 + Math.cos(angle) * 13.6,
    y2: 16 + Math.sin(angle) * 13.6
  }
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    data-brand-mark
  >
    <g
      stroke="currentColor"
      stroke-linecap="round"
      stroke-width="1.6"
      opacity="0.55"
    >
      <line
        v-for="(tick, index) in ticks"
        :key="index"
        :x1="tick.x1.toFixed(2)"
        :y1="tick.y1.toFixed(2)"
        :x2="tick.x2.toFixed(2)"
        :y2="tick.y2.toFixed(2)"
      />
    </g>
    <circle
      cx="16"
      cy="16"
      r="7.4"
      fill="currentColor"
    />
    <line
      x1="16"
      y1="16"
      x2="19.9"
      y2="11.2"
      stroke="var(--ui-primary)"
      stroke-width="2.4"
      stroke-linecap="round"
    />
  </svg>
</template>
