<script setup lang="ts">
import CommandBlock from '~/components/landing/CommandBlock.vue'
import DialDemo from '~/components/landing/home/DialDemo.vue'

/**
 * The first screen: the tagline, what tunables does in one sentence, the
 * install command and the way into the docs, beside one real setting on a
 * panel. The copy sits on the left reading edge; the panel shows rather than
 * tells.
 */
const { hero } = homeContent
</script>

<template>
  <section class="relative isolate overflow-hidden border-b border-default" aria-labelledby="hero-title">
    <div class="site-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
    <UContainer class="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:py-24">
      <div>
        <p class="site-enter font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">
          {{ hero.eyebrow }}
        </p>
        <h1
          id="hero-title"
          class="site-enter mt-5 text-balance text-4xl font-semibold leading-[1.04] tracking-[-0.035em] text-highlighted sm:text-5xl lg:text-[3.6rem]"
          style="--site-enter-delay: 0.06s"
        >
          {{ hero.title }}
        </h1>
        <p class="site-enter mt-6 max-w-xl text-lg leading-relaxed text-default" style="--site-enter-delay: 0.12s">
          {{ hero.description }}
        </p>

        <div class="site-enter mt-8 max-w-md" style="--site-enter-delay: 0.18s">
          <CommandBlock :command="hero.install" :copy-label="hero.installCopyLabel" />
        </div>

        <div class="site-enter mt-5 flex flex-wrap items-center gap-3" style="--site-enter-delay: 0.22s">
          <UButton
            :label="hero.primary.label"
            :to="hero.primary.to"
            size="lg"
            trailing-icon="i-lucide-arrow-right"
          />
          <UButton
            :label="hero.secondary.label"
            :to="hero.secondary.to"
            size="lg"
            color="neutral"
            variant="outline"
          />
        </div>
      </div>

      <div class="site-enter" style="--site-enter-delay: 0.16s">
        <DialDemo />
      </div>
    </UContainer>
  </section>
</template>
