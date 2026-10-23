<script setup lang="ts">
import { usePresets, useTunablesDescription } from 'tunables/vue'

/** Which preset a subject runs as for a slot: the default, or one assigned by reference. */
const props = defineProps<{ set: string, subject: string, slot: string, label?: string }>()
const emit = defineEmits<{ changed: [key: string | null] }>()
const presets = usePresets(toRef(props, 'set'))
const { description } = useTunablesDescription()
const singular = computed(() => description.value?.presets.find(item => item.id === props.set)?.singular ?? 'preset')
const current = ref<string>('default')
const problem = ref<string>()
const busy = ref(false)

async function load() {
  const [assignment] = (await presets.assignments(props.subject)).filter(item => item.slot === props.slot)
  current.value = assignment?.recordId ?? 'default'
}
onMounted(load)
watch(() => [props.subject, props.slot], load)

const items = computed(() => {
  const inSlot = presets.presets.value.filter(preset => preset.slot === props.slot)
  const fallback = inSlot.find(preset => preset.isDefault)
  return [
    { value: 'default', label: `Follow the default (${fallback?.label ?? 'none'})` },
    ...inSlot.map(preset => ({ value: preset.key, label: preset.isDefault ? `${preset.label}, pinned` : preset.label }))
  ]
})

async function choose(value: string) {
  busy.value = true
  try {
    const key = value === 'default' ? null : value
    const outcome = await presets.assign(props.subject, props.slot, key)
    problem.value = outcome.problems[0]?.message
    if (outcome.saved) {
      current.value = value
      emit('changed', key)
    }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <UFormField :label="label ?? `${singular} for ${slot}`" :error="problem">
    <USelect :model-value="current" :items="items" :loading="busy" class="min-w-64" @update:model-value="choose($event as string)" />
  </UFormField>
</template>
