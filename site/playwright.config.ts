import { defineConfig, devices } from '@playwright/test'
import { applyTestServerEnvironment } from './tests/support/environment'

const environment = applyTestServerEnvironment()

// The suites run against what ships: the generated site, served as static files
// the way a static host serves them (`/changelog` from `changelog.html`). CI
// generates once, in the build job, and hands the output to the e2e job;
// locally the server step generates first.
const serve = `serve --no-clipboard --listen ${environment.port} .output/public`
const serverCommand = process.env.CI ? serve : `pnpm generate && ${serve}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  outputDir: 'test-results/playwright',
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  use: {
    baseURL: environment.appURL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry'
  },
  webServer: [{
    command: serverCommand,
    env: environment.env,
    reuseExistingServer: false,
    stderr: 'pipe',
    stdout: 'ignore',
    timeout: 600_000,
    url: environment.appURL
  }],
  workers: process.env.CI ? 2 : undefined,
  projects: [{
    name: 'desktop-chromium',
    testMatch: ['**/landing.spec.ts', '**/landing.desktop.spec.ts', '**/docs.spec.ts', '**/changelog.spec.ts', '**/seo.spec.ts'],
    use: { ...devices['Desktop Chrome'] }
  }, {
    name: 'mobile-chromium',
    testMatch: ['**/landing.spec.ts', '**/landing.mobile.spec.ts', '**/docs.spec.ts'],
    use: {
      ...devices['Pixel 7'],
      contextOptions: { reducedMotion: 'reduce' }
    }
  }]
})
