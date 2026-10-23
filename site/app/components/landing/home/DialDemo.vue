<script setup lang="ts">
/**
 * The hero's panel: one real setting, the news fixture's Story limit, and the
 * checks a save of it runs, worked out in the browser as tunables works them out
 * on the server.
 *
 * - Above Sections per edition × Stories per section, the group's own `rules`
 *   refuse it.
 * - Below a Run Config's Story ceiling, the preset set's `within` refuses it,
 *   naming that Run Config.
 *
 * The words are the library's own; see `homeContent.ts`. Nothing is sent
 * anywhere. The dial is drawn from the value and is decorative: the slider is
 * the control, so a keyboard and a screen reader get a native one.
 */
const { demo } = homeContent
const value = ref(demo.initial)
const inputId = useId()
const helpId = useId()

const problems = computed(() => {
  const found: string[] = []
  if (value.value > demo.ceiling) found.push(demo.ceilingProblem)
  for (const preset of demo.presets) {
    if (preset.ceiling > value.value) {
      found.push(`Run Config "${preset.label}": its Story ceiling, ${preset.ceiling}, is above the Story limit of ${value.value}.`)
    }
  }
  return found
})

const changed = computed(() => value.value !== demo.defaultValue)

// The dial sweeps 270°, from lower left (min) to lower right (max).
const angle = computed(() => -135 + ((value.value - demo.min) / (demo.max - demo.min)) * 270)
const ticks = Array.from({ length: 30 }, (_, index) => {
  const turn = ((135 + (index / 29) * 270) * Math.PI) / 180
  const long = index % 5 === 4 || index === 0
  return {
    x1: 50 + Math.cos(turn) * (long ? 36 : 39),
    y1: 50 + Math.sin(turn) * (long ? 36 : 39),
    x2: 50 + Math.cos(turn) * 43,
    y2: 50 + Math.sin(turn) * 43,
    lit: index + 1 <= value.value
  }
})
</script>

<template>
  <figure class="w-full" data-dial-demo>
    <div class="overflow-hidden rounded-xl border border-default bg-elevated shadow-[0_1px_0_0_var(--ui-border),0_18px_40px_-24px_rgb(13_19_22/0.35)]">
      <div class="flex items-center justify-between gap-3 border-b border-default px-4 py-2.5">
        <p class="text-sm font-semibold text-highlighted">
          {{ demo.group }}
        </p>
        <p class="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          news fixture
        </p>
      </div>

      <div class="px-4 pt-4 pb-5 sm:px-5">
        <p class="text-xs font-medium text-muted">
          {{ demo.section }}
        </p>

        <div class="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 sm:gap-5">
          <svg viewBox="0 0 100 100" class="size-24 shrink-0 sm:size-28" aria-hidden="true">
            <line
              v-for="(tick, index) in ticks"
              :key="index"
              :x1="tick.x1.toFixed(2)"
              :y1="tick.y1.toFixed(2)"
              :x2="tick.x2.toFixed(2)"
              :y2="tick.y2.toFixed(2)"
              stroke-width="2"
              stroke-linecap="round"
              :class="tick.lit ? (problems.length ? 'stroke-(--ui-error)' : 'stroke-(--ui-primary)') : 'stroke-(--ui-border-accented)'"
            />
            <circle
              cx="50"
              cy="50"
              r="27"
              class="fill-(--ui-bg-accented) stroke-(--ui-border-accented)"
              stroke-width="1"
            />
            <g :style="{ transform: `rotate(${angle}deg)`, transformOrigin: '50px 50px', transition: 'transform 120ms ease-out' }">
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="28"
                stroke-width="4"
                stroke-linecap="round"
                class="stroke-(--ui-text-highlighted)"
              />
            </g>
            <circle
              cx="50"
              cy="50"
              r="3"
              class="fill-(--ui-text-highlighted)"
            />
          </svg>

          <div class="min-w-0">
            <div class="flex items-baseline justify-between gap-3">
              <label :for="inputId" class="text-sm font-semibold text-highlighted">{{ demo.field }}</label>
              <output :for="inputId" class="font-mono text-2xl font-medium tabular-nums text-highlighted">{{ value }}</output>
            </div>
            <p :id="helpId" class="mt-0.5 text-xs leading-5 text-muted">
              {{ demo.help }} Default {{ demo.defaultValue }}.
            </p>
            <input
              :id="inputId"
              v-model.number="value"
              type="range"
              :min="demo.min"
              :max="demo.max"
              step="1"
              :aria-describedby="helpId"
              class="mt-3 w-full accent-(--ui-primary)"
            >
            <div class="mt-2 flex flex-wrap gap-1.5">
              <UBadge
                v-for="effect in demo.affects"
                :key="effect"
                :label="effect"
                color="neutral"
                variant="subtle"
                size="sm"
              />
            </div>
          </div>
        </div>

        <ul class="mt-5 divide-y divide-default rounded-lg border border-default text-sm">
          <li
            v-for="preset in demo.presets"
            :key="preset.label"
            class="flex items-center justify-between gap-3 px-3 py-2"
          >
            <span class="text-default">Run Config “{{ preset.label }}”</span>
            <span class="flex items-center gap-1.5 font-mono text-xs" :class="preset.ceiling > value ? 'text-error' : 'text-muted'">
              <UIcon :name="preset.ceiling > value ? 'i-lucide-circle-alert' : 'i-lucide-circle-check'" class="size-3.5" aria-hidden="true" />
              Story ceiling {{ preset.ceiling }}
            </span>
          </li>
        </ul>

        <div class="mt-4 min-h-[5.5rem] rounded-lg border px-3 py-2.5 text-sm" :class="problems.length ? 'border-error/40 bg-error/5' : 'border-default bg-muted'" aria-live="polite">
          <template v-if="problems.length">
            <p class="font-semibold text-error">
              Not saved
            </p>
            <ul class="mt-1 space-y-1 leading-5 text-default">
              <li v-for="problem in problems" :key="problem">
                {{ problem }}
              </li>
            </ul>
          </template>
          <template v-else>
            <p class="font-semibold text-highlighted">
              {{ changed ? 'Checks pass' : 'Saved' }}
            </p>
            <p class="mt-1 leading-5 text-muted">
              {{ changed ? 'Saving records a revision: who, when, why, and the value before and after.' : 'At its default. Turn it down past a Run Config to see the save refused.' }}
            </p>
          </template>
        </div>
      </div>
    </div>
    <figcaption class="mt-3 text-xs leading-5 text-muted">
      {{ demo.caption }}
    </figcaption>
  </figure>
</template>
