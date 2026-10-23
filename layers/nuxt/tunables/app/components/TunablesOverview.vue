<script setup lang="ts">
import { useOverview, useTunablesDescription } from 'tunables/vue'

/**
 * All settings on one page, read-only: each value beside its default, what it
 * affects and where it is edited. Search, filter by effect, or show only what
 * differs from the defaults.
 */
const { description } = useTunablesDescription()
const overview = useOverview()
const search = ref('')
const effect = ref<string>('all')
const changedOnly = ref(false)

const rows = computed(() => {
  const d = description.value
  if (!d) return []
  return overview.entries.value.flatMap((entry) => {
    const group = d.groups.find(item => item.id === entry.group)
    if (!group) return []
    return group.fields.map(field => ({
      key: `${group.id}.${field.key}`,
      group: group.title,
      place: group.place,
      section: field.section,
      label: field.label,
      help: field.help,
      value: entry.display.values[field.key] ?? '—',
      defaultDisplay: entry.display.defaults[field.key] ?? field.defaultDisplay,
      changed: entry.changed.includes(field.key),
      affects: field.affects
    }))
  })
})
const effectItems = computed(() => [{ value: 'all', label: 'Everything' }, ...Object.entries(description.value?.effects ?? {}).map(([value, item]) => ({ value, label: item.label }))])
const visible = computed(() => {
  const needle = search.value.trim().toLowerCase()
  return rows.value.filter(row =>
    (!changedOnly.value || row.changed)
    && (effect.value === 'all' || row.affects.includes(effect.value))
    && (!needle || `${row.label} ${row.group} ${row.section ?? ''} ${row.help ?? ''}`.toLowerCase().includes(needle)))
})
const changedCount = computed(() => rows.value.filter(row => row.changed).length)
const columns = [
  { accessorKey: 'label', header: 'Setting' },
  { accessorKey: 'value', header: 'Value' },
  { accessorKey: 'defaultDisplay', header: 'Default' },
  { accessorKey: 'affects', header: 'Affects' }
]
</script>

<template>
  <section class="tunables-overview">
    <div class="flex flex-wrap items-center gap-3">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Find a setting" class="min-w-56 flex-1" aria-label="Find a setting" />
      <USelect v-model="effect" :items="effectItems" class="min-w-52" aria-label="Show settings that affect" />
      <USwitch v-model="changedOnly" :label="`Only changed (${changedCount})`" />
    </div>
    <UAlert v-if="overview.error.value" class="mt-4" color="error" variant="subtle" :title="overview.error.value" />
    <UTable class="mt-4" :data="visible" :columns="columns" :loading="overview.loading.value" :empty="changedOnly ? 'Every setting is at its default.' : 'No setting matches.'">
      <template #label-cell="{ row }">
        <div class="flex items-center gap-1.5">
          <span class="font-medium text-highlighted">{{ row.original.label }}</span>
          <TunablesFieldHint :label="row.original.label" :help="row.original.help" />
        </div>
        <p class="text-xs text-muted">
          <ULink v-if="row.original.place" :to="row.original.place.href" class="text-primary underline underline-offset-2" :aria-label="`Edit in ${row.original.place.label}`">
            {{ row.original.place.label }}
          </ULink>
          <span v-else>{{ row.original.group }}</span>
          <template v-if="row.original.section">
            · {{ row.original.section }}
          </template>
        </p>
      </template>
      <template #value-cell="{ row }">
        <span :class="row.original.changed ? 'font-medium text-highlighted' : 'text-default'">{{ row.original.value }}</span>
        <UBadge v-if="row.original.changed" class="ml-2" size="sm" color="primary" variant="subtle" label="Changed" />
      </template>
      <template #defaultDisplay-cell="{ row }">
        <span class="text-muted">{{ row.original.defaultDisplay }}</span>
      </template>
      <template #affects-cell="{ row }">
        <TunablesEffects :affects="row.original.affects" :effects="description?.effects" />
      </template>
    </UTable>
  </section>
</template>
