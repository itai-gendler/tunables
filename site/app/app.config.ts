export default defineAppConfig({
  ui: {
    // Teal is what can be turned; amber is what costs something. The ink
    // neutral is defined in assets/css/main.css. See docs/brand.md.
    colors: {
      primary: 'teal',
      secondary: 'amber',
      success: 'emerald',
      info: 'sky',
      warning: 'amber',
      error: 'red',
      neutral: 'ink'
    },
    prose: {
      // Code-block file icons from collections the site bundles. Nuxt UI's
      // defaults name `vscode-icons`, which is not installed, so these would
      // otherwise be fetched from Iconify in the browser.
      codeIcon: {
        'md': 'i-simple-icons-markdown',
        'yml': 'i-simple-icons-yaml',
        'yaml': 'i-simple-icons-yaml',
        'json': 'i-simple-icons-json',
        'ts': 'i-simple-icons-typescript',
        'vue': 'i-simple-icons-vuedotjs',
        'nuxt.config.ts': 'i-simple-icons-nuxt',
        'package.json': 'i-simple-icons-npm',
        '.env.example': 'i-lucide-file-cog',
        'sql': 'i-lucide-database',
        'bash': 'i-lucide-terminal',
        'sh': 'i-lucide-terminal'
      },
      table: {
        slots: {
          root: 'content-table-frame',
          base: 'content-table border-collapse rounded-none'
        }
      },
      pre: {
        // Scroll long lines instead of wrapping them: code and `.env.example`
        // read by their columns, the way GitHub shows the same files.
        slots: {
          base: 'whitespace-pre wrap-normal'
        }
      }
    }
  }
})
