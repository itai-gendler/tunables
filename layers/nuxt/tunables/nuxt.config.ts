/**
 * tunables' screens for Nuxt: extend this layer and the components below are
 * available everywhere, styled by the host's own Nuxt UI theme. The layer
 * brings no colors, fonts or CSS of its own.
 *
 *   export default defineNuxtConfig({ extends: ['tunables/nuxt'] })
 *
 * The screens call the API at `appConfig.tunables.baseURL` with the fetch
 * client. To use another client, such as oRPC, provide it from a plugin of
 * your own: `nuxtApp.vueApp.provide(TUNABLES_CLIENT, orpcClient(client.tunables))`.
 */
export default defineNuxtConfig({
  modules: ['@nuxt/ui']
})
