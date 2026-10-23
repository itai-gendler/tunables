<script setup lang="ts">
import CodeSnippet from '~/components/landing/home/CodeSnippet.vue'
import MoreLink from '~/components/landing/home/MoreLink.vue'
import SectionHead from '~/components/landing/home/SectionHead.vue'

/**
 * Declare once, store in your Postgres, embed the screens, change safely: each
 * step with the code that does it. Steps are numbered because their order is
 * the order you take them in.
 */
const { how } = homeContent
</script>

<template>
  <section :id="how.id" class="scroll-mt-(--ui-header-height)">
    <SectionHead :title="how.title" :description="how.description" :more="how.more" />

    <ol class="mt-10 grid gap-x-8 gap-y-12 lg:grid-cols-2">
      <li v-for="(step, index) in how.steps" :key="step.title" class="flex min-w-0 flex-col">
        <div class="flex items-baseline gap-3">
          <span class="font-mono text-sm text-primary" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <h3 class="text-xl font-semibold tracking-tight text-highlighted">
            {{ step.title }}
          </h3>
        </div>
        <p class="mt-2 text-sm leading-6 text-default">
          {{ step.text }}
        </p>
        <CodeSnippet :code="step.code" :file="step.file" class="mt-4" />
        <MoreLink :link="step.more" class="mt-3" />
      </li>
    </ol>
  </section>
</template>
