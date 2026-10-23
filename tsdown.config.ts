import { defineConfig } from 'tsdown'

export default defineConfig({
  // One entry per published subpath. Each carries type declarations, because
  // host apps compile against them.
  entry: {
    cli: 'src/cli.ts',
    // Run detached by the CLI to look for a newer release.
    'update-check': 'src/update-check.ts',
    index: 'src/index.ts',
    postgres: 'src/postgres/index.ts',
    drizzle: 'src/postgres/drizzle.ts',
    server: 'src/server/index.ts',
    express: 'src/server/express.ts',
    orpc: 'src/server/orpc.ts',
    client: 'src/client/index.ts',
    vue: 'src/vue/index.ts',
    pdd: 'src/pdd/index.ts',
    testing: 'src/testing.ts',
    config: 'src/config.ts'
  },
  format: 'esm',
  platform: 'node',
  // Optional peers stay imports; a CLI-only install never loads them.
  deps: { neverBundle: [/^vue$/, /^postgres$/, /^pg$/, /^express$/, /^@orpc\//, /^drizzle-orm/] },
  minify: false,
  dts: true,
  // The package is `type: module`, so plain `.js` and `.d.ts` are ESM; the
  // `bin` and `exports` paths name them.
  fixedExtension: false,
  clean: true
})
