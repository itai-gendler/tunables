import { defineConfig, devices } from '@playwright/test'

/**
 * Every screen, in both themes, photographed and checked for accessibility.
 * The playground runs built, on in-memory storage reset before each test, so
 * every run starts from the same seeded state. Baselines are kept per platform:
 * CI photographs in Playwright's Linux image.
 */
const port = Number(process.env.PLAYGROUND_PORT ?? 3200)

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled' } },
  snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{projectName}/{arg}{ext}',
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 1360, height: 900 },
    deviceScaleFactor: 1,
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'light', use: { ...devices['Desktop Chrome'], viewport: { width: 1360, height: 900 }, colorScheme: 'light' } },
    { name: 'dark', use: { ...devices['Desktop Chrome'], viewport: { width: 1360, height: 900 }, colorScheme: 'dark' } }
  ],
  webServer: {
    command: `pnpm build && PORT=${port} HOST=127.0.0.1 node .output/server/index.mjs`,
    url: `http://127.0.0.1:${port}/admin/limits`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: { PLAYGROUND_RESETTABLE: '1', NUXT_TELEMETRY_DISABLED: '1' }
  }
})
