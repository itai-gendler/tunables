<script setup lang="ts">
import { displayValue, useHistory, useTunablesDescription, type FieldDescription, type Revision, type RevisionTarget } from 'tunables/vue'

/**
 * A target's revisions, newest first: who changed what, from what to what, and
 * why. A settings group's earlier revision can be restored, checked like any
 * other save.
 */
const props = defineProps<{ target: RevisionTarget }>()
const emit = defineEmits<{ restored: [] }>()
const history = useHistory(toRef(props, 'target'))
const { description } = useTunablesDescription()

const fields = computed<FieldDescription[]>(() => {
  const d = description.value
  if (!d) return []
  if (props.target.kind === 'group') return d.groups.find(group => group.id === props.target.name)?.fields ?? []
  if (props.target.kind === 'catalog') return d.catalogs.find(catalog => catalog.id === props.target.name)?.fields ?? []
  return d.presets.find(set => set.id === props.target.name)?.fields ?? []
})
function describeChange(key: string, from: unknown, to: unknown) {
  const field = fields.value.find(item => item.key === key)
  if (!field) return { label: key, from: from === null ? '—' : String(from), to: to === null ? '—' : String(to) }
  return { label: field.label, from: displayValue(field, from), to: displayValue(field, to) }
}

const restoring = ref<Revision>()
const reason = ref('')
const problems = ref<string[]>([])
const question = ref<string>()
const busy = ref(false)
const open = computed({ get: () => Boolean(restoring.value), set: (value) => { if (!value) close() } })
function close() {
  restoring.value = undefined
  reason.value = ''
  problems.value = []
  question.value = undefined
}
async function restore(confirmed = false) {
  if (!restoring.value) return
  busy.value = true
  try {
    const outcome = await history.restore(restoring.value.id, { reason: reason.value.trim() || undefined, confirmed })
    problems.value = outcome.problems.map(problem => problem.message)
    question.value = outcome.confirm
    if (outcome.saved) {
      close()
      emit('restored')
    }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="tunables-history">
    <UAlert v-if="history.error.value" color="error" variant="subtle" :title="history.error.value" />
    <p v-else-if="!history.loading.value && !history.revisions.value.length" class="text-sm text-muted">
      Nothing has changed yet.
    </p>
    <ol class="divide-y divide-default">
      <li v-for="(revision, index) in history.revisions.value" :key="revision.id" class="py-3">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="text-sm">
            <span class="font-medium text-highlighted">{{ revision.actor ?? 'Someone' }}</span>
            <span class="text-muted" data-tunables-time> · {{ tunablesTime(revision.at) }}</span>
          </p>
          <UButton
            v-if="target.kind === 'group' && index > 0"
            size="xs"
            color="neutral"
            variant="outline"
            icon="i-lucide-undo-2"
            label="Restore"
            @click="restoring = revision"
          />
        </div>
        <p v-if="revision.reason" class="mt-0.5 text-sm text-muted">
          “{{ revision.reason }}”
        </p>
        <ul class="mt-1.5 space-y-0.5 text-sm">
          <li v-for="change in revision.changes" :key="change.key">
            <span class="text-default">{{ describeChange(change.key, change.from, change.to).label }}</span>:
            <span class="text-muted line-through decoration-1">{{ describeChange(change.key, change.from, change.to).from }}</span>
            →
            <span class="font-medium text-highlighted">{{ describeChange(change.key, change.from, change.to).to }}</span>
          </li>
        </ul>
      </li>
    </ol>
    <UButton v-if="history.more.value" class="mt-2" color="neutral" variant="ghost" label="Show older changes" :loading="history.loading.value" @click="history.loadMore()" />

    <UModal v-model:open="open" title="Restore this revision" :description="restoring ? `Put the settings back as they were after ${restoring.actor ?? 'this'} change on ${tunablesTime(restoring.at)}. It is checked like any other save.` : undefined">
      <template #body>
        <UInput v-model="reason" placeholder="Why (kept in the history)" class="w-full" aria-label="Reason for restoring" />
        <p v-if="question" class="mt-3 text-sm text-warning">
          {{ question }}
        </p>
        <ul v-if="problems.length" class="mt-3 space-y-1 text-sm text-error" role="alert">
          <li v-for="problem in problems" :key="problem">
            {{ problem }}
          </li>
        </ul>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="close" />
          <UButton v-if="question" color="warning" label="Restore anyway" :loading="busy" @click="restore(true)" />
          <UButton v-else label="Restore" :loading="busy" @click="restore()" />
        </div>
      </template>
    </UModal>
  </div>
</template>
