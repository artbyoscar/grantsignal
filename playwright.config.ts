import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// Load .env.local so Playwright tests can read CLERK_TEST_USER_* vars
dotenv.config({ path: path.resolve(__dirname, '.env.local') })

/**
 * Playwright E2E Test Configuration for GrantSignal
 *
 * Run: pnpm test:e2e
 * Run headed: pnpm test:e2e:headed
 * Run specific file: pnpm test:e2e -- e2e/onboarding.spec.ts
 *
 * Auth: Tests use Clerk test mode. Set CLERK_TEST_USER_EMAIL and
 * CLERK_TEST_USER_PASSWORD in .env.local for authenticated flows.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start dev server before running tests (local only) */
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
