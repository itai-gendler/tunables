<script setup lang="ts">
type Who = 'staff' | 'owner' | 'member'
const who = useCookie<Who>('playground-who', { default: () => 'staff' })

/** Each person sees what Tasklane would show them: staff the administration, an owner their workspace, a member their own settings. */
const navs: Record<Who, { label: string, children: { label: string, to: string }[] }[]> = {
  staff: [
    { label: 'Workspaces', children: [{ label: 'Workspaces', to: '/admin/workspaces' }, { label: 'Plans', to: '/admin/plans' }, { label: 'Limits', to: '/admin/limits' }] },
    { label: 'Tasks', children: [{ label: 'Workspace defaults', to: '/admin/defaults' }, { label: 'Models', to: '/admin/models' }] },
    { label: 'All settings', children: [{ label: 'All settings', to: '/admin/settings' }] }
  ],
  owner: [{ label: 'Acme', children: [{ label: 'Workspace settings', to: '/workspace' }] }],
  member: [{ label: 'Acme', children: [{ label: 'My settings', to: '/me' }] }]
}
const nav = computed(() => navs[who.value] ?? navs.staff)
const people = [
  { value: 'staff', label: 'Sam (Tasklane staff)' },
  { value: 'owner', label: 'Olivia (owns Acme)' },
  { value: 'member', label: 'Dana (member of Acme)' }
]
async function switchTo(value: Who) {
  who.value = value
  await navigateTo(value === 'owner' ? '/workspace' : value === 'member' ? '/me' : '/admin/limits')
  reloadNuxtApp()
}
</script>

<template>
  <div class="min-h-dvh bg-default">
    <header class="border-b border-default">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <NuxtLink to="/" class="font-semibold text-highlighted">
          Tasklane
        </NuxtLink>
        <span class="text-xs text-muted">tunables playground</span>
        <div class="ml-auto flex items-center gap-2">
          <USelect :model-value="who" :items="people" class="w-60" aria-label="Signed in as" @update:model-value="switchTo($event as Who)" />
          <UColorModeButton />
        </div>
      </div>
    </header>
    <div class="mx-auto grid max-w-6xl gap-8 px-4 py-6 md:grid-cols-[11rem_minmax(0,1fr)]">
      <nav aria-label="Settings">
        <ul class="space-y-4 text-sm">
          <li v-for="area in nav" :key="area.label">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted">
              {{ area.label }}
            </p>
            <ul class="mt-1 space-y-0.5">
              <li v-for="item in area.children" :key="item.to">
                <NuxtLink :to="item.to" class="block rounded-md px-2 py-1 text-default hover:bg-elevated" active-class="bg-elevated font-medium text-highlighted" exact-active-class="bg-elevated font-medium text-highlighted">
                  {{ item.label }}
                </NuxtLink>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
      <main class="min-w-0">
        <slot />
      </main>
    </div>
  </div>
</template>
