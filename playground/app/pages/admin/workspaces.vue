<script setup lang="ts">
useHead({ title: 'Workspaces' })
/** Tasklane's workspaces, each on a plan or on the default one. */
const workspaces = [
  { id: 'acme', name: 'Acme', members: 12 },
  { id: 'hobby', name: 'Hobby club', members: 3 }
]
</script>

<template>
  <section>
    <header class="border-b border-default pb-4">
      <h2 class="text-lg font-semibold text-highlighted">
        Workspaces
      </h2>
      <p class="mt-1 max-w-prose text-sm text-muted">
        Each workspace is on the default plan, or on the plan it is assigned. Its owner may lower its limits below the plan's.
      </p>
    </header>
    <ul class="mt-4 divide-y divide-default rounded-md border border-default">
      <li v-for="workspace in workspaces" :key="workspace.id" class="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p class="font-medium text-highlighted">
            {{ workspace.name }}
          </p>
          <p class="text-xs text-muted">
            {{ workspace.members }} members
          </p>
        </div>
        <TunablesAssign set="plans" :subject="workspace.id" slot="plan" label="Plan" />
      </li>
    </ul>
  </section>
</template>
