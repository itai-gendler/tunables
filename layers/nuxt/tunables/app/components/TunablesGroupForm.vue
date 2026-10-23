<script setup lang="ts">
import { useGroupForm, useTunablesClient, useTunablesDescription, type CatalogEntrySummary, type FieldDescription } from 'tunables/vue'

/**
 * A settings group, edited beside what it affects: every field by section, with
 * its explanation and default; one save that is checked whole; a confirmation
 * when the change has consequences; and the group's history.
 */
const props = withDefaults(defineProps<{ group: string, history?: boolean }>(), { history: true })

const form = useGroupForm(toRef(props, 'group'))
const { description } = useTunablesDescription()
useTunablesLeaveGuard(form.dirty)

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const sections = computed(() => {
  const group = form.group.value
  if (!group) return []
  const named = group.sections.map(name => ({ name, anchor: `tunables-${group.id}-${slug(name)}`, fields: group.fields.filter(field => field.section === name) }))
  const loose = group.fields.filter(field => !field.section)
  return loose.length ? [{ name: 'General', anchor: `tunables-${group.id}-general`, fields: loose }, ...named] : named
})
// A pick setting chooses from its catalog's Available entries.
const client = useTunablesClient()
const catalogEntries = ref<Record<string, CatalogEntrySummary[]>>({})
watch(() => form.group.value?.fields.filter(field => field.kind === 'pick').map(field => field.catalog!) ?? [], async (ids) => {
  for (const id of new Set(ids)) {
    if (!catalogEntries.value[id]) catalogEntries.value = { ...catalogEntries.value, [id]: await client.catalog(id) }
  }
}, { immediate: true })
function entriesFor(field: FieldDescription) {
  if (field.kind !== 'pick' || !field.catalog) return undefined
  const labelField = description.value?.catalogs.find(item => item.id === field.catalog)?.labelField
  return (catalogEntries.value[field.catalog] ?? []).filter(entry => entry.state === 'available')
    .map(entry => ({ value: entry.id, label: labelField ? String(entry.values[labelField] ?? entry.id) : entry.id }))
}
const dirtyIn = (fields: FieldDescription[]) => fields.some(field => form.dirtyKeys.value.includes(field.key))
const showHistory = ref(false)
const confirmOpen = computed({ get: () => Boolean(form.confirm.value), set: (open) => { if (!open) form.cancelConfirm() } })
const savedNotice = ref(false)

async function save() {
  const saved = await form.save()
  if (saved) {
    savedNotice.value = true
    setTimeout(() => { savedNotice.value = false }, 2500)
  }
}
async function confirmAndSave() {
  if (await form.confirmAndSave()) savedNotice.value = true
}
</script>

<template>
  <section class="tunables-group-form" :aria-busy="form.loading.value">
    <header class="flex flex-wrap items-start justify-between gap-3 border-b border-default pb-4">
      <div class="min-w-0">
        <h2 class="text-lg font-semibold text-highlighted">
          {{ form.group.value?.title ?? 'Settings' }}
        </h2>
        <p v-if="form.group.value?.description" class="mt-1 max-w-prose text-sm text-muted">
          {{ form.group.value.description }}
        </p>
        <p v-if="form.entry.value?.updatedAt" class="mt-1 text-xs text-muted" data-tunables-time>
          Last changed {{ tunablesTime(form.entry.value.updatedAt) }}<template v-if="form.entry.value.updatedBy">
            by {{ form.entry.value.updatedBy }}
          </template>
        </p>
      </div>
      <UButton v-if="history" icon="i-lucide-history" color="neutral" variant="outline" label="History" @click="showHistory = true" />
    </header>

    <UAlert v-if="form.error.value" class="mt-4" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="form.error.value" />
    <UAlert
      v-if="form.generalProblems.value.length"
      class="mt-4"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Not saved"
    >
      <template #description>
        <ul class="list-disc space-y-1 pl-4">
          <li v-for="problem in form.generalProblems.value" :key="problem.message">
            {{ problem.message }}
          </li>
        </ul>
      </template>
    </UAlert>

    <div v-if="form.loading.value && !form.entry.value" class="mt-6 space-y-3">
      <USkeleton v-for="n in 4" :key="n" class="h-12 w-full" />
    </div>

    <div v-else-if="form.group.value" class="mt-2 grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <nav v-if="sections.length > 1" class="hidden lg:block" aria-label="Sections">
        <ul class="sticky top-4 space-y-1 text-sm">
          <li v-for="section in sections" :key="section.anchor">
            <a :href="`#${section.anchor}`" class="flex items-center gap-2 rounded-md px-2 py-1 text-muted hover:bg-elevated hover:text-default">
              <span class="min-w-0">{{ section.name }}</span>
              <span v-if="dirtyIn(section.fields)" class="size-1.5 shrink-0 rounded-full bg-primary" aria-label="Unsaved changes" />
            </a>
          </li>
        </ul>
      </nav>
      <div class="min-w-0" :class="sections.length > 1 ? '' : 'lg:col-span-2'">
        <section v-for="section in sections" :id="section.anchor" :key="section.anchor" class="scroll-mt-4 pt-4">
          <h3 v-if="sections.length > 1" class="text-xs font-semibold uppercase tracking-wide text-muted">
            {{ section.name }}
          </h3>
          <div class="divide-y divide-default">
            <TunablesField
              v-for="field in section.fields"
              :key="field.key"
              v-model="form.draft[field.key]"
              :field="field"
              :effects="description?.effects"
              :entries="entriesFor(field)"
              :notes="form.entry.value?.notes[field.key]"
              :problems="form.fieldProblems(field.key)"
              :dirty="form.dirtyKeys.value.includes(field.key)"
              @reset="form.toDefault(field)"
            />
          </div>
        </section>
      </div>
    </div>

    <div
      v-if="form.dirty.value || savedNotice"
      class="sticky bottom-0 z-10 -mx-1 mt-6 flex flex-wrap items-center gap-3 border-t border-default bg-default/95 px-1 py-3 backdrop-blur"
      role="region"
      aria-label="Unsaved changes"
    >
      <template v-if="form.dirty.value">
        <span class="text-sm font-medium text-highlighted">
          {{ form.dirtyKeys.value.length }} unsaved {{ form.dirtyKeys.value.length === 1 ? 'change' : 'changes' }}
        </span>
        <UInput v-model="form.reason.value" placeholder="Why (kept in the history)" class="min-w-48 flex-1" aria-label="Reason for this change" />
        <UButton color="neutral" variant="ghost" label="Discard" @click="form.discard()" />
        <UButton label="Save" icon="i-lucide-check" :loading="form.saving.value" @click="save" />
      </template>
      <span v-else class="inline-flex items-center gap-2 text-sm text-success" role="status">
        <UIcon name="i-lucide-circle-check" /> Saved
      </span>
    </div>

    <UModal v-model:open="confirmOpen" title="Confirm this change" :description="form.confirm.value">
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" label="Keep editing" @click="form.cancelConfirm()" />
          <UButton label="Save anyway" color="warning" :loading="form.saving.value" @click="confirmAndSave" />
        </div>
      </template>
    </UModal>

    <USlideover v-if="history" v-model:open="showHistory" :title="`${form.group.value?.title ?? 'Settings'} history`">
      <template #body>
        <TunablesHistory :target="{ kind: 'group', name: group }" @restored="form.refresh()" />
      </template>
    </USlideover>
  </section>
</template>
