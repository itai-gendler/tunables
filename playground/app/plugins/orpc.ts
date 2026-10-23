import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { orpcClient } from 'tunables/client'
import { TUNABLES_CLIENT } from 'tunables/vue'

/** The screens call tunables through the app's own oRPC router, as news does. */
export default defineNuxtPlugin((nuxtApp) => {
  const url = import.meta.server ? useRequestURL().origin : window.location.origin
  const link = new RPCLink({ url: `${url}/rpc`, headers: () => import.meta.server ? useRequestHeaders(['cookie']) : {} })
  const client = createORPCClient<{ tunables: Record<string, (input?: unknown) => Promise<unknown>> }>(link)
  nuxtApp.vueApp.provide(TUNABLES_CLIENT, orpcClient(client.tunables))
})
