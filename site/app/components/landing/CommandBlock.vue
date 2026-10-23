<script setup lang="ts">
/**
 * A command, the way this site shows one: mono type on its own ground, a prompt
 * glyph, and one control that copies it. The prompt is a claim about where the
 * command runs, so it is `null` for anything not typed at a shell.
 *
 * The copy control names what it copies, because a page with two of these
 * would otherwise give a screen reader two identical buttons.
 */
const { command, prompt = '$', copyLabel } = defineProps<{
  command: string
  prompt?: string | null
  copyLabel?: string
}>()

const { copied, copy } = useCopyText()
const commandText = useTemplateRef<HTMLElement>('commandText')
const copyFailed = ref(false)

async function copyCommand() {
  if (await copy(command)) {
    copyFailed.value = false
    return
  }
  // The clipboard was refused: select the command so the reader's own copy
  // shortcut takes it, and say so on the control.
  copyFailed.value = true
  const element = commandText.value
  const selection = window.getSelection()
  if (element && selection) selection.selectAllChildren(element)
}

const label = computed(() => {
  if (copied.value) return `Copied ${command}`
  if (copyFailed.value) return 'Copying is blocked here; the command is selected, copy it with your keyboard'
  return copyLabel ?? `Copy ${command}`
})
</script>

<template>
  <div class="flex items-center gap-3 rounded-lg border border-default bg-elevated px-3.5 py-2.5" data-command-block>
    <span v-if="prompt" class="select-none font-mono text-sm text-muted" aria-hidden="true">{{ prompt }}</span>
    <code ref="commandText" class="min-w-0 flex-1 whitespace-nowrap font-mono text-sm text-highlighted">{{ command }}</code>
    <UButton
      :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
      :aria-label="label"
      color="neutral"
      variant="ghost"
      size="xs"
      @click="copyCommand"
    />
  </div>
</template>
