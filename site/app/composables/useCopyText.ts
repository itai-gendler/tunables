/**
 * Copy a string to the clipboard and flag it for a moment afterwards, clearing
 * the timer when the component that asked unmounts.
 */
export function useCopyText(resetAfter = 2000) {
  const copied = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  /**
   * Resolves `false` when the browser refuses the clipboard — an insecure
   * origin, a denied permission, an embedded view — so the caller can fall
   * back to selecting the text instead of failing silently.
   */
  async function copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      return false
    }
    copied.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      copied.value = false
    }, resetAfter)
    return true
  }

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  return { copied, copy }
}
