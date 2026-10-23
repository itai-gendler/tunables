<script setup lang="ts">
import SectionHead from '~/components/landing/home/SectionHead.vue'

/** Your server, your database, your sign-in: nothing runs beside your app. */
const { attaches } = homeContent
</script>

<template>
  <section :id="attaches.id" class="scroll-mt-(--ui-header-height)">
    <SectionHead :title="attaches.title" :description="attaches.description" :more="attaches.more" />

    <ul class="mt-10 grid gap-px overflow-hidden rounded-lg border border-default bg-(--ui-border) md:grid-cols-3">
      <li v-for="item in attaches.items" :key="item.title" class="flex flex-col bg-elevated p-5">
        <UIcon :name="item.icon" class="size-5 text-primary" aria-hidden="true" />
        <h3 class="mt-3 text-lg font-semibold tracking-tight text-highlighted">
          {{ item.title }}
        </h3>
        <p class="mt-1.5 text-sm leading-6 text-default">
          {{ item.text }}
        </p>
        <p class="mt-auto pt-4 font-mono text-xs leading-5 text-muted">
          {{ item.detail }}
        </p>
      </li>
    </ul>
    <p class="mt-4 max-w-3xl text-sm leading-6 text-muted">
      Boot never needs the database: creating tunables checks your definitions and touches nothing else, and a read can fall back to the last values it saw.
    </p>
  </section>
</template>
