<script setup lang="ts">
import CommandBlock from '~/components/landing/CommandBlock.vue'
import SectionHead from '~/components/landing/home/SectionHead.vue'

/** The skills, the CLI an agent runs, and where explanations come from. */
const { agents } = homeContent
</script>

<template>
  <section :id="agents.id" class="scroll-mt-(--ui-header-height)">
    <SectionHead :title="agents.title" :description="agents.description" :more="agents.more" />

    <div class="mt-10 grid gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div class="rounded-lg border border-default bg-elevated p-5">
        <h3 class="text-base font-semibold tracking-tight text-highlighted">
          Three skills
        </h3>
        <p class="mt-1.5 text-sm leading-6 text-default">
          Installed for Claude Code, Codex CLI, Cursor, Gemini CLI and GitHub Copilot, in the project or for your user.
        </p>
        <CommandBlock :command="agents.install" class="mt-4" copy-label="Copy the skills install command" />
        <ul class="mt-5 divide-y divide-default border-t border-default">
          <li v-for="skill in agents.skills" :key="skill.name" class="grid gap-1 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
            <code class="font-mono text-sm text-primary">{{ skill.name }}</code>
            <p class="text-sm leading-6 text-default">
              {{ skill.text }}
            </p>
          </li>
        </ul>
      </div>

      <div class="flex flex-col gap-3">
        <div class="rounded-lg border border-default bg-elevated p-5">
          <h3 class="text-base font-semibold tracking-tight text-highlighted">
            One CLI for people and agents
          </h3>
          <dl class="mt-3 space-y-3">
            <div v-for="item in agents.commands" :key="item.command">
              <dt class="font-mono text-sm text-highlighted">
                {{ item.command }}
              </dt>
              <dd class="mt-0.5 text-sm leading-6 text-default">
                {{ item.text }}
              </dd>
            </div>
          </dl>
        </div>
        <div class="rounded-lg border border-default bg-elevated p-5">
          <h3 class="text-base font-semibold tracking-tight text-highlighted">
            Explained by your Product Model
          </h3>
          <p class="mt-1.5 text-sm leading-6 text-default">
            Field explanations come from a pdd-kit Product Model, and <code class="font-mono text-[13px]">tunables check</code> fails when a default disagrees with the one the model states.
          </p>
          <ULink :to="agents.pdd.link.to" target="_blank" class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary underline underline-offset-2">
            {{ agents.pdd.link.label }}
            <UIcon name="i-lucide-arrow-up-right" class="size-3.5" aria-hidden="true" />
          </ULink>
        </div>
      </div>
    </div>
  </section>
</template>
