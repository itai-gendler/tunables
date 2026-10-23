import { defineNuxtConfig } from 'nuxt/config'

/** A host app as it would extend tunables' screens from the installed package. */
export default defineNuxtConfig({
  extends: ['tunables/nuxt'],
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  ssr: true,
  compatibilityDate: '2024-11-01'
})
