<script setup lang="ts">
import UProsePre, { type ProsePreProps } from '@nuxt/ui/runtime/components/prose/Pre.vue'

/*
 * `copy` defaults to true here as it does in Nuxt UI. Declared through
 * `ProsePreProps`, an absent boolean prop is cast to `false` and passed on by
 * `v-bind="props"`, which would silently remove the copy button.
 */
const props = withDefaults(defineProps<ProsePreProps>(), { copy: true })

/*
 * A long line scrolls the block sideways, and a scrollable region a keyboard
 * cannot reach fails WCAG 2.1.1. So the `<pre>` takes a tab stop, but only while
 * it overflows. Whether it overflows is only known after layout, so this runs in
 * the browser, and again whenever the block resizes or the fonts finish loading.
 */
const block = useTemplateRef<{ $el: HTMLElement }>('block')
let resizeObserver: ResizeObserver | undefined

function syncScrollFocus(pre: HTMLPreElement) {
  if (pre.scrollWidth > pre.clientWidth) pre.tabIndex = 0
  else pre.removeAttribute('tabindex')
}

onMounted(() => {
  const pre = block.value?.$el.querySelector('pre')
  if (!pre) return
  syncScrollFocus(pre)
  resizeObserver = new ResizeObserver(() => syncScrollFocus(pre))
  resizeObserver.observe(pre)
  void document.fonts.ready.then(() => syncScrollFocus(pre))
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <UProsePre ref="block" v-bind="props">
    <slot />
  </UProsePre>
</template>
