/**
 * Tasklane's own route guard: each person opens only their own pages, and is
 * sent home from anyone else's. The screens never decide who sees them, and the
 * API checks every request again with `authorize`.
 */
export default defineNuxtRouteMiddleware((to) => {
  const who = usePlaygroundWho().value
  if (!opens(who, to.path)) return navigateTo(homeOf(who), { replace: true })
})
