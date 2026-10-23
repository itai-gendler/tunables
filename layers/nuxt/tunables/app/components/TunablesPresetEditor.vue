<script setup lang="ts">
import { useCatalog, useTunablesDescription, type PresetSummary, type PresetsDescription, type Problem } from 'tunables/vue'

/** One preset's form: its key and slot when new, its label, and its fields by section. */
const props = defineProps<{ set: PresetsDescription, preset?: PresetSummary, saving?: boolean, problems?: Problem[] }>()
const emit = defineEmits<{ save: [input: { key: string, slot: string, label: string, values: Record<string, unknown>, reason?: string }], cancel: [] }>()
const { description } = useTunablesDescription()

const key = ref(props.preset?.key ?? '')
const slot = ref(props.preset?.slot ?? props.set.slots[0] ?? '')
const label = ref(props.preset?.label ?? '')
const reason = ref('')
const values = reactive<Record<string, unknown>>(JSON.parse(JSON.stringify({
  ...Object.fromEntries(props.set.fields.map(field => [field.key, field.default])),
  ...props.preset?.values
})))

const catalogIds = [...new Set(props.set.fields.filter(field => field.kind === 'pick').map(field => field.catalog!))]
const catalogs = Object.fromEntries(catalogIds.map(id => [id, useCatalog(id)]))
function entriesFor(catalog?: string) {
  if (!catalog) return []
  const definition = description.value?.catalogs.find(item => item.id === catalog)
  return (catalogs[catalog]?.available.value ?? []).map(entry => ({
    value: entry.id,
    label: definition?.labelField ? String(entry.values[definition.labelField] ?? entry.id) : entry.id
  }))
}
const sections = computed(() => {
  const named = [...new Set(props.set.fields.map(field => field.section ?? 'General'))]
  return named.map(name => ({ name, fields: props.set.fields.filter(field => (field.section ?? 'General') === name) }))
})
const tab = ref(sections.value[0]?.name)
const tabs = computed(() => sections.value.map(section => ({ label: section.name, value: section.name, slot: 'fields' as const })))
const problemsFor = (field: string) => (props.problems ?? []).filter(problem => problem.key === field).map(problem => problem.message)
const general = computed(() => (props.problems ?? []).filter(problem => !problem.key || ['key', 'slot', 'label'].includes(problem.key) || !props.set.fields.some(field => field.key === problem.key)))

function submit() {
  emit('save', { key: key.value.trim(), slot: slot.value, label: label.value.trim(), values: JSON.parse(JSON.stringify(values)), reason: reason.value.trim() || undefined })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div class="grid gap-4 sm:grid-cols-3">
      <UFormField label="Label" required>
        <UInput v-model="label" class="w-full" />
      </UFormField>
      <UFormField label="Key" :help="preset ? 'A key never changes.' : 'Lowercase letters, digits and hyphens.'">
        <UInput v-model="key" class="w-full" :disabled="Boolean(preset)" />
      </UFormField>
      <UFormField label="Slot" :help="preset ? 'A slot never changes.' : undefined">
        <USelect v-model="slot" :items="set.slots" class="w-full" :disabled="Boolean(preset)" />
      </UFormField>
    </div>
    <UAlert v-if="general.length" color="error" variant="subtle" icon="i-lucide-circle-alert" title="Not saved">
      <template #description>
        <ul class="list-disc space-y-1 pl-4">
          <li v-for="problem in general" :key="problem.message">
            {{ problem.message }}
          </li>
        </ul>
      </template>
    </UAlert>
    <UTabs v-model="tab" :items="tabs" variant="link" :unmount-on-hide="false">
      <template #fields="{ item }">
        <div class="divide-y divide-default">
          <TunablesField
            v-for="field in sections.find(section => section.name === item.value)?.fields ?? []"
            :key="field.key"
            v-model="values[field.key]"
            :field="field"
            :effects="description?.effects"
            :entries="entriesFor(field.catalog)"
            :problems="problemsFor(field.key)"
            @reset="values[field.key] = JSON.parse(JSON.stringify(field.default))"
          />
        </div>
      </template>
    </UTabs>
    <div class="flex flex-wrap items-center justify-end gap-2 border-t border-default pt-4">
      <UInput v-model="reason" placeholder="Why (kept in the history)" class="min-w-48 flex-1" aria-label="Reason for this change" />
      <UButton color="neutral" variant="ghost" label="Cancel" @click="emit('cancel')" />
      <UButton type="submit" :label="preset ? 'Save' : `Create ${set.singular}`" :loading="saving" />
    </div>
  </form>
</template>
