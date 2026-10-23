import { defineConfig } from 'vitest/config'

/**
 * Integration suites run against a real Postgres. `pnpm db:test` starts one in
 * Docker; set TUNABLES_TEST_DATABASE_URL to use another.
 */
export default defineConfig({
  test: {
    include: ['test/integration/**/*.test.ts'],
    // The CLI suite spawns the built command.
    globalSetup: ['./test/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000
  }
})
