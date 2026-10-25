<script setup lang="ts">
import { displayValue, useCatalog, useTunablesClient, useTunablesDescription, type PresetSummary, type PresetsDescription, type Problem } from 'tunables/vue'

/**
 * One preset's form: its key and slot when new, its label, and its fields by
 * section. A new preset starts as a copy of its slot's default, and starts
 * again from the other slot's default if the slot is changed before anything
 * else is. A preset is a named whole, so its fields show no default of their
 * own; a field held below a setting shows that setting's current value.
 */
const props = defineProps<{
  set: PresetsDescription
  preset?: PresetSummary
  /** Each slot's default preset's values, which a new preset starts from. */
  startFrom?: Record<string, Record<string, unknown>>
  saving?: boolean
  problems?: Problem[]
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>()
const emit = defineEmits<{ save: [input: { key: string, slot: string, label: string, values: Record<string, unknown>, reason?: string }], cancel: [] }>()
const { description } = useTunablesDescription()
const client = useTunablesClient()

const key = ref(props.preset?.key ?? '')
const slot = ref(props.preset?.slot ?? props.set.slots[0] ?? '')
const label = ref(props.preset?.label ?? '')
const reason = ref('')
const startingValues = (forSlot: string) => JSON.parse(JSON.stringify({
  ...Object.fromEntries(props.set.fields.map(field => [field.key, field.default])),
  ...(props.preset ? props.preset.values : props.startFrom?.[forSlot])
})) as Record<string, unknown>
const values = reactive<Record<string, unknown>>(startingValues(slot.value))
let started = JSON.stringify(values)
watch(slot, (next) => {
  if (props.preset || JSON.stringify(values) !== started) return
  Object.assign(values, startingValues(next))
  started = JSON.stringify(values)
})

// The settings each bounded field is held below, read once when the form opens.
const limitValues = ref<Record<string, Record<string, unknown>>>({})
const boundGroups = [...new Set(props.set.fields.map(field => field.atMost?.group).filter((group): group is string => Boolean(group)))]
onMounted(async () => {
  const read = await Promise.all(boundGroups.map(async group => [group, (await client.group(group)).values] as const))
  limitValues.value = Object.fromEntries(read)
})
function limitOf(field: PresetsDescription['fields'][number]) {
  if (!field.atMost) return undefined
  const value = limitValues.value[field.atMost.group]?.[field.atMost.key]
  const limitField = description.value?.groups.find(group => group.id === field.atMost!.group)?.fields.find(item => item.key === field.atMost!.key)
  if (value === undefined || !limitField) return undefined
  return `At most ${displayValue(limitField, value)}, the ${field.atMost.label}`
}

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
        <UInput v-model="label" class="w-full" :size="size" />
      </UFormField>
      <UFormField label="Key" :help="preset ? 'A key never changes.' : 'Lowercase letters, digits and hyphens.'">
        <UInput v-model="key" class="w-full" :disabled="Boolean(preset)" :size="size" />
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
            :size="size"
            v-for="field in sections.find(section => section.name === item.value)?.fields ?? []"
            :key="field.key"
            v-model="values[field.key]"
            :field="field"
            :effects="description?.effects"
            :entries="entriesFor(field.catalog)"
            :problems="problemsFor(field.key)"
            :limit="limitOf(field)"
            hide-default
          />
        </div>
      </template>
    </UTabs>
    <div class="flex flex-wrap items-center justify-end gap-2 border-t border-default pt-4">
      <UInput v-model="reason" placeholder="Why (kept in the history)" class="min-w-48 flex-1" aria-label="Reason for this change" :size="size" />
      <UButton color="neutral" variant="ghost" label="Cancel" :size="size" @click="emit('cancel')" />
      <UButton type="submit" :label="preset ? 'Save' : `Create ${set.singular}`" :loading="saving" :size="size" />
    </div>
  </form>
</template>
