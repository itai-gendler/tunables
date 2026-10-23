import type { Ref } from 'vue'
import { useUnloadGuard } from 'tunables/vue'

/** Ask before leaving a form with unsaved changes, by link or by closing the tab. */
export function useTunablesLeaveGuard(dirty: Ref<boolean>, message = 'You have unsaved changes. Leave without saving them?') {
  useUnloadGuard(dirty)
  onBeforeRouteLeave(() => {
    if (dirty.value && !window.confirm(message)) return false
  })
}
