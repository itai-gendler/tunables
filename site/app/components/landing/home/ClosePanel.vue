<script setup lang="ts">
/** The close: one line, one sentence, one button. */
const { close } = homeContent
</script>

<template>
  <section id="get-started" class="scroll-mt-(--ui-header-height) relative overflow-hidden rounded-xl border border-default bg-elevated px-6 py-10 sm:px-10 sm:py-12">
    <div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div class="max-w-2xl">
        <h2 class="text-balance text-3xl font-semibold tracking-[-0.04em] text-highlighted sm:text-4xl">
          {{ close.title }}
        </h2>
        <p class="mt-4 text-base leading-7 text-default">
          {{ close.description }}
        </p>
      </div>
      <UButton
        :label="close.action.label"
        :to="close.action.to"
        size="lg"
        trailing-icon="i-lucide-arrow-right"
        class="self-start md:self-auto"
      />
    </div>
  </section>
</template>
