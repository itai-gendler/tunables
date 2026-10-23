import { fileURLToPath } from 'node:url'

const source = (path: string) => fileURLToPath(new URL(`../src/${path}`, import.meta.url))

/**
 * The playground runs the news fixture through tunables' own layer, with the
 * package's subpaths pointed at their source so a change shows without a build.
 */
export default defineNuxtConfig({
  extends: ['../layers/nuxt/tunables'],
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  compatibilityDate: '2026-10-01',
  alias: {
    'tunables/client': source('client/index.ts'),
    'tunables/vue': source('vue/index.ts'),
    'tunables/server': source('server/index.ts'),
    'tunables/orpc': source('server/orpc.ts'),
    'tunables/postgres': source('postgres/index.ts'),
    'tunables': source('index.ts')
  },
  nitro: {
    alias: {
      'tunables/server': source('server/index.ts'),
      'tunables/orpc': source('server/orpc.ts'),
      'tunables/postgres': source('postgres/index.ts'),
      'tunables': source('index.ts')
    }
  },
  typescript: { strict: true }
})
