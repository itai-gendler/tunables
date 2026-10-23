<script setup lang="ts">
import { usePresets, useTunablesDescription, type PresetSummary, type Problem } from 'tunables/vue'

/**
 * A preset set, such as Run Configs: each slot's presets with its default and
 * how many follow each, and creating, editing, defaulting and removing them.
 */
const props = defineProps<{ set: string }>()
const { description } = useTunablesDescription()
const presets = usePresets(toRef(props, 'set'))
const definition = computed(() => description.value?.presets.find(item => item.id === props.set))

const editing = ref<PresetSummary | 'new'>()
const problems = ref<Problem[]>([])
const saving = ref(false)
const notice = ref<string>()
const editorOpen = computed({ get: () => editing.value !== undefined, set: (open) => { if (!open) editing.value = undefined } })
const removing = ref<PresetSummary>()
const removeOpen = computed({ get: () => Boolean(removing.value), set: (open) => { if (!open) removing.value = undefined } })
const historyFor = ref<PresetSummary>()
const historyOpen = computed({ get: () => Boolean(historyFor.value), set: (open) => { if (!open) historyFor.value = undefined } })

const followers = (preset: PresetSummary) => `${preset.key} · ${preset.assigned} assigned${preset.isDefault ? ', and everyone who follows the default' : ''}`
const bySlot = computed(() => (definition.value?.slots ?? []).map(slot => ({ slot, presets: presets.presets.value.filter(preset => preset.slot === slot) })))

function open(preset: PresetSummary | 'new') {
  problems.value = []
  editing.value = preset
}
async function save(input: { key: string, slot: string, label: string, values: Record<string, unknown>, reason?: string }) {
  saving.value = true
  try {
    const outcome = editing.value === 'new'
      ? await presets.create(input)
      : await presets.update((editing.value as PresetSummary).key, { label: input.label, values: input.values, reason: input.reason })
    problems.value = outcome.problems
    if (outcome.saved) {
      notice.value = `${input.label} saved.`
      editing.value = undefined
    }
  } finally {
    saving.value = false
  }
}
async function makeDefault(preset: PresetSummary) {
  const outcome = await presets.makeDefault(preset.key)
  notice.value = outcome.saved ? `${preset.label} is now the default for ${preset.slot}.` : outcome.problems[0]?.message
}
async function remove() {
  if (!removing.value) return
  const outcome = await presets.remove(removing.value.key)
  notice.value = outcome.saved ? `${removing.value.label} removed.` : outcome.problems[0]?.message
  removing.value = undefined
}
</script>

<template>
  <section class="tunables-presets">
    <header class="flex flex-wrap items-start justify-between gap-3 border-b border-default pb-4">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">
          {{ definition?.title ?? set }}
        </h2>
        <p v-if="definition?.description" class="mt-1 max-w-prose text-sm text-muted">
          {{ definition.description }}
        </p>
      </div>
      <UButton v-if="definition" icon="i-lucide-plus" :label="`New ${definition.singular}`" @click="open('new')" />
    </header>
    <UAlert v-if="presets.error.value" class="mt-4" color="error" variant="subtle" :title="presets.error.value" />
    <p v-if="notice" class="mt-3 text-sm text-muted" role="status">
      {{ notice }}
    </p>

    <div v-for="group in bySlot" :key="group.slot" class="mt-6">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">
        {{ group.slot }}
      </h3>
      <ul class="mt-2 divide-y divide-default rounded-md border border-default">
        <li v-for="preset in group.presets" :key="preset.key" class="flex flex-wrap items-center gap-3 px-4 py-3">
          <div class="min-w-0 flex-1">
            <p class="font-medium text-highlighted">
              {{ preset.label }}
              <UBadge v-if="preset.isDefault" class="ml-2" size="sm" variant="subtle" label="Default" />
            </p>
            <p class="text-xs text-muted">
              {{ followers(preset) }}
            </p>
          </div>
          <UButton size="sm" color="neutral" variant="outline" label="Edit" @click="open(preset)" />
          <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide-history" :aria-label="`${preset.label} history`" @click="historyFor = preset" />
          <UButton v-if="!preset.isDefault" size="sm" color="neutral" variant="ghost" label="Make default" @click="makeDefault(preset)" />
          <UButton v-if="!preset.isDefault" size="sm" color="error" variant="ghost" icon="i-lucide-trash-2" :aria-label="`Remove ${preset.label}`" @click="removing = preset" />
        </li>
      </ul>
    </div>

    <USlideover v-if="definition" v-model:open="editorOpen" :title="editing === 'new' ? `New ${definition.singular}` : `Edit ${(editing as PresetSummary | undefined)?.label ?? ''}`" :ui="{ content: 'sm:max-w-3xl' }">
      <template #body>
        <TunablesPresetEditor
          v-if="editing"
          :key="editing === 'new' ? 'new' : editing.key"
          :set="definition"
          :preset="editing === 'new' ? undefined : editing"
          :saving="saving"
          :problems="problems"
          @save="save"
          @cancel="editing = undefined"
        />
      </template>
    </USlideover>

    <UModal v-model:open="removeOpen" :title="`Remove ${removing?.label}?`" :description="removing?.assigned ? `${removing.assigned} assigned return to the default ${definition?.singular ?? ''}.` : 'Nobody is assigned it.'">
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" label="Keep it" @click="removing = undefined" />
          <UButton color="error" label="Remove" @click="remove" />
        </div>
      </template>
    </UModal>

    <USlideover v-model:open="historyOpen" :title="`${historyFor?.label ?? ''} history`">
      <template #body>
        <TunablesHistory v-if="historyFor" :target="{ kind: 'preset', name: set, id: historyFor.key }" />
      </template>
    </USlideover>
  </section>
</template>
