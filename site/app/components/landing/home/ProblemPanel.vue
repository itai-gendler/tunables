<script setup lang="ts">
import SectionHead from '~/components/landing/home/SectionHead.vue'

/** Where settings live before tunables, and what that costs. */
const { problem } = homeContent
</script>

<template>
  <section :id="problem.id" class="scroll-mt-(--ui-header-height)">
    <SectionHead :title="problem.title" :description="problem.description" :more="problem.more" />

    <ul class="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <li
        v-for="item in problem.items"
        :key="item.title"
        class="rounded-lg border border-default bg-elevated p-4"
      >
        <UIcon :name="item.icon" class="size-5 text-muted" aria-hidden="true" />
        <h3 class="mt-3 text-base font-semibold tracking-tight text-highlighted">
          {{ item.title }}
        </h3>
        <p class="mt-1.5 text-sm leading-6 text-default">
          {{ item.note }}
        </p>
      </li>
    </ul>

    <dl class="mt-3 grid gap-px overflow-hidden rounded-lg border border-default bg-(--ui-border) md:grid-cols-3">
      <div v-for="consequence in problem.consequences" :key="consequence.title" class="bg-default p-4">
        <dt class="flex items-center gap-2 text-sm font-semibold text-highlighted">
          <span class="size-1.5 rounded-full bg-(--ui-error)" aria-hidden="true" />
          {{ consequence.title }}
        </dt>
        <dd class="mt-1.5 text-sm leading-6 text-default">
          {{ consequence.text }}
        </dd>
      </div>
    </dl>
  </section>
</template>
