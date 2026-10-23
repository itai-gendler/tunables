<script setup lang="ts">
import AgentsPanel from '~/components/landing/home/AgentsPanel.vue'
import AttachesPanel from '~/components/landing/home/AttachesPanel.vue'
import ClosePanel from '~/components/landing/home/ClosePanel.vue'
import GuardrailsPanel from '~/components/landing/home/GuardrailsPanel.vue'
import Hero from '~/components/landing/home/Hero.vue'
import ProblemPanel from '~/components/landing/home/ProblemPanel.vue'
import StepsPanel from '~/components/landing/home/StepsPanel.vue'

/**
 * The home page: the hero, then six sections with one job each, in the order a
 * reader asks their questions.
 *
 * 1. **Where your settings live today**: the problem, in the places it lives.
 * 2. **How it works**: declare once, store, embed, change safely.
 * 3. **Guardrails**: what a save is checked against, with real answers.
 * 4. **Built for coding agents**: skills, the CLI, the Product Model.
 * 5. **It attaches**: your server, your database, your sign-in.
 * 6. **The close**: one way in.
 *
 * Every word is in `utils/homeContent.ts`.
 */
</script>

<template>
  <div>
    <Hero />
    <UContainer class="space-y-20 py-16 sm:space-y-28 sm:py-24">
      <ProblemPanel />
      <StepsPanel />
      <GuardrailsPanel />
      <AgentsPanel />
      <AttachesPanel />
      <ClosePanel />
    </UContainer>
  </div>
</template>
