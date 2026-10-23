<script setup lang="ts">
import type { Guardrail } from '~/utils/homeContent'
import SectionHead from '~/components/landing/home/SectionHead.vue'

/**
 * What a save is checked against, each with the answer tunables gives, word
 * for word, for the news fixture. The answer is the evidence; the heading only
 * names it.
 */
const { guardrails } = homeContent

const TONE: Record<Guardrail['tone'], { label: string, icon: string, class: string }> = {
  refused: { label: 'Refused', icon: 'i-lucide-circle-x', class: 'text-error' },
  asks: { label: 'Asks first', icon: 'i-lucide-circle-help', class: 'text-warning' },
  kept: { label: 'Recorded', icon: 'i-lucide-history', class: 'text-primary' }
}
</script>

<template>
  <section :id="guardrails.id" class="scroll-mt-(--ui-header-height)">
    <SectionHead :title="guardrails.title" :description="guardrails.description" :more="guardrails.more" />

    <ul class="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="item in guardrails.items"
        :key="item.title"
        class="flex flex-col rounded-lg border border-default bg-elevated p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-base font-semibold tracking-tight text-highlighted">
            {{ item.title }}
          </h3>
          <code class="shrink-0 rounded border border-default bg-muted px-1.5 py-0.5 font-mono text-[11px] text-default">{{ item.api }}</code>
        </div>
        <p class="mt-1.5 text-sm leading-6 text-default">
          {{ item.text }}
        </p>
        <div class="mt-auto pt-4">
          <p class="flex items-center gap-1.5 text-xs font-semibold" :class="TONE[item.tone].class">
            <UIcon :name="TONE[item.tone].icon" class="size-3.5" aria-hidden="true" />
            {{ TONE[item.tone].label }}
          </p>
          <p class="mt-1.5 border-l-2 border-default pl-3 font-mono text-[12.5px] leading-5 text-highlighted">
            {{ item.answer }}
          </p>
        </div>
      </li>
    </ul>
  </section>
</template>
