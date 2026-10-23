/** The host's own look: tunables' screens take it on with no CSS of their own. */
export default defineAppConfig({
  ui: {
    colors: { primary: 'teal', neutral: 'slate' }
  },
  // The playground's own plugin provides an oRPC client, as news would.
  tunables: { baseURL: false }
})
