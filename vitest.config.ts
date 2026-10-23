import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Several suites spawn the built CLI, so it is built once before any file runs.
    globalSetup: ['./test/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    // The site and the playground have their own suites; integration tests run
    // against Postgres with `pnpm test:integration`.
    exclude: [...configDefaults.exclude, '.claude/worktrees/**', 'site/**', 'playground/**', 'test/integration/**']
  }
})
