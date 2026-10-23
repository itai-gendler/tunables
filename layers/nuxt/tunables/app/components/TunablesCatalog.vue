<script setup lang="ts">
import { displayValue, useCatalog, useTunablesDescription, type CatalogEntrySummary, type Problem } from 'tunables/vue'

/**
 * A catalog of allowed choices, such as permitted models: add and edit
 * entries, and retire or reinstate them. Entries are never deleted, and one in
 * use cannot be retired.
 */
const props = defineProps<{ catalog: string }>()
const { description } = useTunablesDescription()
const catalog = useCatalog(toRef(props, 'catalog'))
const definition = computed(() => description.value?.catalogs.find(item => item.id === props.catalog))
const nameOf = (entry: CatalogEntrySummary) => definition.value?.labelField ? String(entry.values[definition.value.labelField] ?? entry.id) : entry.id
const summaryFields = computed(() => (definition.value?.fields ?? []).filter(field => field.key !== definition.value?.labelField && field.kind !== 'text').slice(0, 3))

const editing = ref<CatalogEntrySummary | 'new'>()
const entryId = ref('')
const values = reactive<Record<string, unknown>>({})
const reason = ref('')
const problems = ref<Problem[]>([])
const saving = ref(false)
const notice = ref<string>()
const editorOpen = computed({ get: () => editing.value !== undefined, set: (open) => { if (!open) editing.value = undefined } })

function open(entry: CatalogEntrySummary | 'new') {
  problems.value = []
  reason.value = ''
  entryId.value = entry === 'new' ? '' : entry.id
  for (const key of Object.keys(values)) delete values[key]
  Object.assign(values, JSON.parse(JSON.stringify({
    ...Object.fromEntries((definition.value?.fields ?? []).map(field => [field.key, field.default])),
    ...(entry === 'new' ? {} : entry.values)
  })))
  editing.value = entry
}
async function save() {
  saving.value = true
  try {
    const copy = JSON.parse(JSON.stringify(values))
    const outcome = editing.value === 'new'
      ? await catalog.add({ id: entryId.value.trim(), values: copy, reason: reason.value.trim() || undefined })
      : await catalog.edit((editing.value as CatalogEntrySummary).id, copy, reason.value.trim() || undefined)
    problems.value = outcome.problems
    if (outcome.saved) {
      notice.value = `${outcome.value ? nameOf({ ...outcome.value, usedBy: [] }) : entryId.value} saved.`
      editing.value = undefined
    }
  } finally {
    saving.value = false
  }
}
async function toggle(entry: CatalogEntrySummary) {
  const outcome = entry.state === 'available' ? await catalog.retire(entry.id) : await catalog.reinstate(entry.id)
  notice.value = outcome.saved ? `${nameOf(entry)} is ${entry.state === 'available' ? 'retired' : 'available again'}.` : outcome.problems[0]?.message
}
const problemsFor = (key: string) => problems.value.filter(problem => problem.key === key).map(problem => problem.message)
const general = computed(() => problems.value.filter(problem => !problem.key || problem.key === 'id'))
</script>

<template>
  <section class="tunables-catalog">
    <header class="flex flex-wrap items-start justify-between gap-3 border-b border-default pb-4">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">
          {{ definition?.title ?? catalog }}
        </h2>
        <p v-if="definition?.description" class="mt-1 max-w-prose text-sm text-muted">
          {{ definition.description }}
        </p>
      </div>
      <UButton v-if="definition" icon="i-lucide-plus" :label="`Add ${definition.singular.toLowerCase()}`" @click="open('new')" />
    </header>
    <UAlert v-if="catalog.error.value" class="mt-4" color="error" variant="subtle" :title="catalog.error.value" />
    <p v-if="notice" class="mt-3 text-sm text-muted" role="status">
      {{ notice }}
    </p>
    <ul class="mt-4 divide-y divide-default rounded-md border border-default">
      <li v-for="entry in catalog.entries.value" :key="entry.id" class="flex flex-wrap items-center gap-3 px-4 py-3" :class="entry.state === 'retired' ? 'opacity-70' : ''">
        <div class="min-w-0 flex-1">
          <p class="font-medium text-highlighted">
            {{ nameOf(entry) }}
            <UBadge v-if="entry.state === 'retired'" class="ml-2" size="sm" color="neutral" variant="subtle" label="Retired" />
          </p>
          <p class="text-xs text-muted">
            {{ entry.id }}<template v-for="field in summaryFields" :key="field.key">
              · {{ field.label }} {{ displayValue(field, entry.values[field.key]) }}
            </template>
          </p>
          <p v-if="entry.usedBy.length" class="mt-0.5 text-xs text-muted">
            Used by {{ entry.usedBy.join(', ') }}
          </p>
        </div>
        <UButton size="sm" color="neutral" variant="outline" label="Edit" @click="open(entry)" />
        <UButton
          size="sm"
          color="neutral"
          variant="ghost"
          :label="entry.state === 'available' ? 'Retire' : 'Reinstate'"
          :disabled="entry.state === 'available' && entry.usedBy.length > 0"
          :title="entry.state === 'available' && entry.usedBy.length ? `In use by ${entry.usedBy.join(', ')}` : undefined"
          @click="toggle(entry)"
        />
      </li>
    </ul>

    <USlideover v-if="definition" v-model:open="editorOpen" :title="editing === 'new' ? `Add ${definition.singular.toLowerCase()}` : `Edit ${editing ? nameOf(editing as CatalogEntrySummary) : ''}`" :ui="{ content: 'sm:max-w-2xl' }">
      <template #body>
        <form class="space-y-2" @submit.prevent="save">
          <UFormField :label="definition.idLabel" :help="editing === 'new' ? 'An id never changes.' : undefined">
            <UInput v-model="entryId" class="w-full max-w-md" :disabled="editing !== 'new'" />
          </UFormField>
          <UAlert v-if="general.length" color="error" variant="subtle" icon="i-lucide-circle-alert" title="Not saved">
            <template #description>
              <ul class="list-disc space-y-1 pl-4">
                <li v-for="problem in general" :key="problem.message">
                  {{ problem.message }}
                </li>
              </ul>
            </template>
          </UAlert>
          <div class="divide-y divide-default">
            <TunablesField
              v-for="field in definition.fields"
              :key="field.key"
              v-model="values[field.key]"
              :field="field"
              :effects="description?.effects"
              :problems="problemsFor(field.key)"
              @reset="values[field.key] = JSON.parse(JSON.stringify(field.default))"
            />
          </div>
          <div class="flex flex-wrap items-center justify-end gap-2 border-t border-default pt-4">
            <UInput v-model="reason" placeholder="Why (kept in the history)" class="min-w-48 flex-1" aria-label="Reason for this change" />
            <UButton color="neutral" variant="ghost" label="Cancel" @click="editing = undefined" />
            <UButton type="submit" :label="editing === 'new' ? 'Add' : 'Save'" :loading="saving" />
          </div>
        </form>
      </template>
    </USlideover>
  </section>
</template>
