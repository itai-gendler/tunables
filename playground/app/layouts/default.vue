<script setup lang="ts">
const who = useCookie<'admin' | 'reader'>('playground-who', { default: () => 'admin' })
const nav = [
  { label: 'Feeds', children: [{ label: 'Settings', to: '/admin/feeds/settings' }] },
  { label: 'Run Configs', children: [{ label: 'Run Configs', to: '/admin/run-configs' }, { label: 'Settings', to: '/admin/run-configs/settings' }, { label: 'Models', to: '/admin/run-configs/models' }] },
  { label: 'Readers', children: [{ label: 'Readers', to: '/admin/readers' }, { label: 'Limits', to: '/admin/readers/limits' }] },
  { label: 'All settings', children: [{ label: 'All settings', to: '/admin/settings' }] }
]
const people = [{ value: 'admin', label: 'Ada (Administrator)' }, { value: 'reader', label: 'Rae (reader)' }]
function switchTo(value: 'admin' | 'reader') {
  who.value = value
  reloadNuxtApp()
}
</script>

<template>
  <div class="min-h-dvh bg-default">
    <header class="border-b border-default">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <NuxtLink to="/" class="font-semibold text-highlighted">
          news · administration
        </NuxtLink>
        <span class="text-xs text-muted">tunables playground</span>
        <div class="ml-auto flex items-center gap-2">
          <USelect :model-value="who" :items="people" class="w-52" aria-label="Signed in as" @update:model-value="switchTo($event as 'admin' | 'reader')" />
          <UColorModeButton />
        </div>
      </div>
    </header>
    <div class="mx-auto grid max-w-6xl gap-8 px-4 py-6 md:grid-cols-[11rem_minmax(0,1fr)]">
      <nav aria-label="Administration">
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
