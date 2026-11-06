<script setup lang="ts">
import { useGroupForm } from 'tunables/vue'

useHead({ title: 'My tasks' })

/**
 * Tasklane's own page for Dana, built on `useGroupForm` instead of the layer's
 * form: she picks her view and her week where she uses them, and each choice is
 * saved as she makes it, at her own scope in Acme. Until she picks, she
 * follows Acme's.
 */
const form = useGroupForm('workspace', { scope: { workspace: 'acme', user: 'dana' } })
const layers = computed(() => form.entry.value?.layers ?? {})
const status = ref('')

async function choose(key: string, value: unknown) {
  form.draft[key] = value
  form.setHere(key)
  await keep()
}
async function follow(key: string) {
  form.useInherited(key)
  await keep()
}
async function keep() {
  status.value = await form.save() ? 'Saved' : ''
}
/** Where a value comes from, as Tasklane says it to a member. */
const source = (key: string) => layers.value[key]?.fromLabel === 'System' ? 'Tasklane' : layers.value[key]?.fromLabel

const view = computed({ get: () => String(form.draft.defaultView ?? 'list'), set: value => choose('defaultView', value) })
const views = [
  { label: 'List', value: 'list', icon: 'i-lucide-list' },
  { label: 'Board', value: 'board', icon: 'i-lucide-columns-3' },
  { label: 'Calendar', value: 'calendar', icon: 'i-lucide-calendar-days' }
]
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const weekStartsOn = computed(() => Number(form.draft.weekStartsOn ?? 1))
const dueSoonDays = computed(() => Number(form.draft.dueSoonDays ?? 2))
const preferences = computed(() => [
  { key: 'weekStartsOn', label: 'Week starts on', items: weekdays.map((label, value) => ({ label, value })) },
  { key: 'dueSoonDays', label: 'Due soon', items: [...new Set([1, 2, 3, 5, 7, 14, dueSoonDays.value])].sort((a, b) => a - b).map(value => ({ label: value === 1 ? '1 day ahead' : `${value} days ahead`, value })) },
  { key: 'reminderHour', label: 'Daily reminder', items: Array.from({ length: 24 }, (_, value) => ({ label: `${String(value).padStart(2, '0')}:00`, value })) }
].filter(preference => preference.key in layers.value))

/** Dana's tasks in Acme, due relative to a fixed Wednesday so the page reads the same every day. */
const today = 3
const tasks = [
  { title: 'Draft the homepage copy', status: 'doing', dueIn: 0 },
  { title: 'Review the new logo', status: 'todo', dueIn: 1 },
  { title: 'Book the user interviews', status: 'todo', dueIn: 3 },
  { title: 'Pick a font pairing', status: 'doing', dueIn: 5 },
  { title: 'Set up analytics', status: 'done', dueIn: -2 }
]
const columns = [{ status: 'todo', label: 'To do' }, { status: 'doing', label: 'Doing' }, { status: 'done', label: 'Done' }]
const dueSoon = (task: typeof tasks[number]) => task.status !== 'done' && task.dueIn >= 0 && task.dueIn <= dueSoonDays.value
const due = (task: typeof tasks[number]) => task.status === 'done' ? 'Done' : task.dueIn === 0 ? 'Today' : task.dueIn === 1 ? 'Tomorrow' : weekdays[(today + task.dueIn) % 7]
/** This week, from the day Dana's week starts on, with the tasks due each day. */
const week = computed(() => Array.from({ length: 7 }, (_, index) => {
  const day = (weekStartsOn.value + index) % 7
  const offset = index - ((today - weekStartsOn.value + 7) % 7)
  return { day, label: weekdays[day]!.slice(0, 3), today: offset === 0, tasks: tasks.filter(task => task.dueIn === offset) }
}))
</script>

<template>
  <section>
    <header class="flex flex-wrap items-end justify-between gap-4 border-b border-default pb-4">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">
          My tasks
        </h2>
        <p class="mt-1 text-sm text-muted">
          Website redesign · Acme
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <p v-if="layers.defaultView" class="text-xs text-muted" data-preference="defaultView">
          <template v-if="layers.defaultView.overridden">
            Your own ·
            <UButton variant="link" size="xs" class="p-0" :label="`Use ${source('defaultView')}'s (${layers.defaultView.inheritedDisplay})`" @click="follow('defaultView')" />
          </template>
          <template v-else>
            Same as {{ source('defaultView') }}
          </template>
        </p>
        <UTabs v-model="view" :items="views" :content="false" variant="link" aria-label="View" />
      </div>
    </header>

    <div v-if="form.loading.value && !form.entry.value" class="mt-6 space-y-3">
      <USkeleton v-for="n in 4" :key="n" class="h-10 w-full" />
    </div>

    <div v-else class="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div class="min-w-0">
        <ul v-if="view === 'list'" class="divide-y divide-default rounded-md border border-default">
          <li v-for="task in tasks" :key="task.title" class="flex items-center gap-3 px-4 py-3 text-sm">
            <UIcon :name="task.status === 'done' ? 'i-lucide-circle-check' : 'i-lucide-circle'" class="size-4 shrink-0 text-muted" />
            <span class="min-w-0 flex-1" :class="task.status === 'done' ? 'text-muted line-through' : 'text-default'">{{ task.title }}</span>
            <UBadge v-if="dueSoon(task)" color="neutral" variant="subtle" icon="i-lucide-clock" label="Due soon" />
            <span class="w-20 text-right text-xs text-muted">{{ due(task) }}</span>
          </li>
        </ul>

        <div v-else-if="view === 'board'" class="grid gap-4 sm:grid-cols-3">
          <section v-for="column in columns" :key="column.status" class="rounded-md bg-elevated p-3">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">
              {{ column.label }}
            </h3>
            <ul class="mt-3 space-y-2">
              <li v-for="task in tasks.filter(item => item.status === column.status)" :key="task.title" class="rounded-md border border-default bg-default p-3 text-sm">
                <p class="text-default">
                  {{ task.title }}
                </p>
                <p class="mt-2 flex items-center gap-2 text-xs text-muted">
                  {{ due(task) }}
                  <UBadge v-if="dueSoon(task)" color="neutral" variant="subtle" icon="i-lucide-clock" label="Due soon" />
                </p>
              </li>
            </ul>
          </section>
        </div>

        <ol v-else class="grid grid-cols-7 overflow-hidden rounded-md border border-default text-sm" aria-label="This week">
          <li v-for="day in week" :key="day.day" class="min-h-40 border-default p-2 not-last:border-r" :class="day.today ? 'bg-elevated' : ''">
            <p class="text-xs font-semibold" :class="day.today ? 'text-highlighted' : 'text-muted'">
              {{ day.label }}<span v-if="day.today" class="font-normal"> · today</span>
            </p>
            <ul class="mt-2 space-y-1">
              <li v-for="task in day.tasks" :key="task.title" class="rounded border border-default bg-default p-1.5 text-xs" :class="task.status === 'done' ? 'text-muted line-through' : 'text-default'">
                {{ task.title }}
              </li>
            </ul>
          </li>
        </ol>
      </div>

      <aside class="space-y-4">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">
          My preferences in Acme
        </h3>
        <div v-for="preference in preferences" :key="preference.key" :data-preference="preference.key">
          <UFormField :label="preference.label" :error="form.fieldProblems(preference.key)[0]">
            <USelect :model-value="Number(form.draft[preference.key])" :items="preference.items" class="w-full" @update:model-value="choose(preference.key, $event)" />
          </UFormField>
          <p class="mt-1 text-xs text-muted">
            <template v-if="layers[preference.key]?.overridden">
              Your own ·
              <UButton variant="link" size="xs" class="p-0" :label="`Use ${source(preference.key)}'s (${layers[preference.key]?.inheritedDisplay})`" @click="follow(preference.key)" />
            </template>
            <template v-else>
              Same as {{ source(preference.key) }}
            </template>
          </p>
        </div>
        <p role="status" class="text-xs text-muted">
          {{ form.saving.value ? 'Saving…' : status }}
        </p>
        <UAlert v-if="form.error.value || form.generalProblems.value.length" color="error" variant="subtle" :title="form.error.value ?? form.generalProblems.value[0]?.message" />
      </aside>
    </div>
  </section>
</template>
