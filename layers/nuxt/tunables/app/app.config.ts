export default defineAppConfig({
  tunables: {
    /** Where the host mounted tunables' API, or `false` when the app provides its own client. */
    baseURL: '/api/tunables' as string | false
  }
})
