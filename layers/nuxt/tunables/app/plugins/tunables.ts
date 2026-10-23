import { fetchClient } from 'tunables/client'
import { TUNABLES_CLIENT } from 'tunables/vue'

/**
 * The screens' client: the fetch API at `appConfig.tunables.baseURL`. An app
 * that provides its own client, such as oRPC, sets `baseURL: false`.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const config = useAppConfig() as { tunables?: { baseURL?: string | false } }
  if (config.tunables?.baseURL === false) return
  nuxtApp.vueApp.provide(TUNABLES_CLIENT, fetchClient({ baseURL: config.tunables?.baseURL }))
})
