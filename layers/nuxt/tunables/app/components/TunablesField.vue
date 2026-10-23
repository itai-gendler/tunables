<script setup lang="ts">
import { displayValue, type Description, type FieldDescription } from 'tunables/vue'

/**
 * One field: its label and explanation, the input its kind calls for, what it
 * affects, live notes, problems in its own words, and a way back to its default.
 */
const props = defineProps<{
  field: FieldDescription
  modelValue: unknown
  problems?: string[]
  notes?: string[]
  effects?: Description['effects']
  /** Changed since it was last saved. */
  dirty?: boolean
  /** Entries a pick field may choose from. */
  entries?: { value: string, label: string }[]
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: unknown], 'reset': [] }>()

const id = useId()
// The input a kind calls for decides the value's type; the description says which kind it is.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const value = computed<any>({
  get: () => props.modelValue,
  set: next => emit('update:modelValue', next)
})
const isDefault = computed(() => JSON.stringify(props.modelValue) === JSON.stringify(props.field.default))
const emptyDefault = computed(() => props.field.default === '' || (Array.isArray(props.field.default) && props.field.default.length === 0))
const step = computed(() => props.field.integer === false ? 0.01 : 1)
const unitLabel = computed(() => props.field.unit && !['dollars', 'hour', 'weekday', 'percent'].includes(props.field.unit.id) ? props.field.unit.label : '')
const prefix = computed(() => props.field.unit?.id === 'dollars' ? '$' : '')
const options = computed(() => props.field.options ?? [])
const pickItems = computed(() => {
  const items = [...(props.entries ?? [])]
  if (typeof props.modelValue === 'string' && !items.some(item => item.value === props.modelValue)) items.push({ value: props.modelValue, label: `${props.modelValue} (retired)` })
  return items
})
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((label, index) => ({ value: index, label }))
const hours = Array.from({ length: 24 }, (_, hour) => ({ value: hour, label: `${String(hour).padStart(2, '0')}:00` }))

function part(key: 'min' | 'max' | 'width' | 'height', next: number | null | undefined) {
  emit('update:modelValue', { ...(props.modelValue as Record<string, number>), [key]: next ?? undefined })
}
const pair = computed(() => (props.modelValue ?? {}) as Record<string, number>)
</script>

<template>
  <div class="@container" :data-field="field.key">
    <div class="grid gap-x-6 gap-y-2 py-4 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
    <div class="min-w-0">
      <div class="flex items-center gap-1.5">
        <label :for="id" class="text-sm font-medium text-highlighted">{{ field.label }}</label>
        <TunablesFieldHint :label="field.label" :help="field.help" :default-display="field.defaultDisplay" />
        <span v-if="dirty" class="size-1.5 rounded-full bg-primary" aria-label="Unsaved change" />
      </div>
      <TunablesEffects class="mt-1" :affects="field.affects" :effects="effects" />
      <p v-for="note in notes" :key="note" class="mt-1 text-xs text-muted">
        {{ note }}
      </p>
    </div>

    <div class="min-w-0">
      <div class="flex flex-wrap items-center gap-2">
        <template v-if="field.kind === 'number' && field.unit?.id === 'hour'">
          <USelect :id="id" v-model="value" :items="hours" class="w-32" :disabled="disabled" />
        </template>
        <template v-else-if="field.kind === 'number' && field.unit?.id === 'weekday'">
          <USelect :id="id" v-model="value" :items="weekdays" class="w-40" :disabled="disabled" />
        </template>
        <template v-else-if="field.kind === 'number'">
          <span v-if="prefix" class="text-sm text-muted">{{ prefix }}</span>
          <UInputNumber :id="id" v-model="value" :min="field.min" :max="field.max" :step="step" :step-snapping="false" allow-invalid class="w-40" :disabled="disabled" />
          <span v-if="unitLabel" class="text-sm text-muted">{{ unitLabel }}</span>
        </template>
        <template v-else-if="field.kind === 'range'">
          <UInputNumber :id="id" :model-value="pair.min" :min="field.min" :max="field.max" :step="step" allow-invalid class="w-32" :aria-label="`${field.label}, shortest`" :disabled="disabled" @update:model-value="part('min', $event)" />
          <span class="text-sm text-muted">to</span>
          <UInputNumber :model-value="pair.max" :min="field.min" :max="field.max" :step="step" allow-invalid class="w-32" :aria-label="`${field.label}, longest`" :disabled="disabled" @update:model-value="part('max', $event)" />
          <span v-if="unitLabel" class="text-sm text-muted">{{ unitLabel }}</span>
        </template>
        <template v-else-if="field.kind === 'size'">
          <UInputNumber :id="id" :model-value="pair.width" :min="1" allow-invalid class="w-32" :aria-label="`${field.label}, width`" :disabled="disabled" @update:model-value="part('width', $event)" />
          <span class="text-sm text-muted">×</span>
          <UInputNumber :model-value="pair.height" :min="1" allow-invalid class="w-32" :aria-label="`${field.label}, height`" :disabled="disabled" @update:model-value="part('height', $event)" />
          <span class="text-sm text-muted">pixels</span>
        </template>
        <template v-else-if="field.kind === 'toggle'">
          <USwitch :id="id" v-model="value" :label="value ? 'On' : 'Off'" :disabled="disabled" />
        </template>
        <template v-else-if="field.kind === 'choice' && options.length <= 3">
          <URadioGroup :id="id" v-model="value" :items="options" orientation="horizontal" :disabled="disabled" />
        </template>
        <template v-else-if="field.kind === 'choice'">
          <USelect :id="id" v-model="value" :items="options" class="min-w-48" :disabled="disabled" />
        </template>
        <template v-else-if="field.kind === 'choices'">
          <UCheckboxGroup :id="id" v-model="value" :items="options" orientation="horizontal" :disabled="disabled" />
        </template>
        <template v-else-if="field.kind === 'text' && field.multiline">
          <UTextarea :id="id" v-model="value" :maxlength="field.maxLength" :rows="3" autoresize class="w-full" :disabled="disabled" />
        </template>
        <template v-else-if="field.kind === 'text'">
          <UInput :id="id" v-model="value" :maxlength="field.maxLength" class="w-full max-w-md" :disabled="disabled" />
        </template>
        <template v-else-if="field.kind === 'pick'">
          <USelect :id="id" v-model="value" :items="pickItems" class="min-w-56" :disabled="disabled" />
        </template>
      </div>

      <div class="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-muted">
        <span>Default: {{ emptyDefault ? 'none' : field.defaultDisplay }}</span>
        <UButton
          v-if="!isDefault && !disabled"
          size="xs"
          variant="link"
          color="neutral"
          icon="i-lucide-rotate-ccw"
          :label="emptyDefault ? 'Clear' : `Reset to ${displayValue(field, field.default)}`"
          class="px-0"
          @click="emit('reset')"
        />
      </div>
      <p v-for="problem in problems" :key="problem" class="mt-1.5 text-sm text-error" role="alert">
        {{ problem }}
      </p>
    </div>
    </div>
  </div>
</template>
