import { type Page, expect } from '@playwright/test'

/**
 * Shared E2E test utilities for GrantSignal
 *
 * Clerk Authentication: Tests can run in two modes.
 * 1. Clerk Testing Tokens (recommended for CI): set CLERK_TESTING_TOKEN env var
 *    and tests will bypass the Clerk UI entirely.
 * 2. Manual login: set CLERK_TEST_USER_EMAIL and CLERK_TEST_USER_PASSWORD to
 *    drive the Clerk sign-in form directly.
 */

/** Wait for the Next.js app shell to finish hydrating */
export async function waitForAppReady(page: Page) {
  // Wait for the main content area to render
  await page.waitForSelector('#main-content', { timeout: 15_000 })
  // Wait for network to quiet down (tRPC queries)
  await page.waitForLoadState('networkidle')
}

/**
 * Sign in through Clerk's UI.
 * Requires CLERK_TEST_USER_EMAIL and CLERK_TEST_USER_PASSWORD in env.
 */
export async function signInWithClerk(page: Page) {
  const email = process.env.CLERK_TEST_USER_EMAIL
  const password = process.env.CLERK_TEST_USER_PASSWORD

  if (!email || !password) {
    throw new Error(
      'CLERK_TEST_USER_EMAIL and CLERK_TEST_USER_PASSWORD must be set for E2E auth tests'
    )
  }

  await page.goto('/sign-in')
  await page.waitForSelector('.cl-signIn-root', { timeout: 10_000 })

  // Clerk renders an email input first
  await page.getByLabel('Email address').fill(email)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  // Then a password input
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  // Wait for redirect after successful login
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 })
}

/**
 * Authenticate using Clerk Testing Tokens (faster, no UI interaction).
 * Set CLERK_TESTING_TOKEN in .env.local and add the __clerk_testing_token
 * cookie before navigating.
 */
export async function signInWithTestingToken(page: Page) {
  const token = process.env.CLERK_TESTING_TOKEN
  if (!token) {
    throw new Error('CLERK_TESTING_TOKEN must be set for token-based auth')
  }

  await page.context().addCookies([
    {
      name: '__clerk_db_jwt',
      value: token,
      domain: 'localhost',
      path: '/',
    },
  ])
}

/**
 * Authenticate using the best available method, then navigate.
 * Priority: CLERK_TESTING_TOKEN > email/password > skip
 */
export async function authenticateAndNavigate(page: Page, path = '/dashboard') {
  const token = process.env.CLERK_TESTING_TOKEN

  if (token) {
    // Fastest: inject testing token cookie before navigating
    await signInWithTestingToken(page)
    await page.goto(path)
    await waitForAppReady(page)
    return
  }

  // Fallback: email/password or GitHub OAuth
  await page.goto(path)
  if (page.url().includes('/sign-in')) {
    const email = process.env.CLERK_TEST_USER_EMAIL
    const password = process.env.CLERK_TEST_USER_PASSWORD

    if (email && password) {
      await signInWithClerk(page)
    } else {
      throw new Error(
        'No auth credentials found. Set CLERK_TESTING_TOKEN (recommended) or CLERK_TEST_USER_EMAIL + CLERK_TEST_USER_PASSWORD in .env.local'
      )
    }
  }
  await waitForAppReady(page)
}

/** Navigate to a dashboard page, handling any auth redirects */
export async function navigateToDashboard(page: Page, path = '/dashboard') {
  await authenticateAndNavigate(page, path)
}

/** Check if any auth credentials are configured */
export function hasAuthCredentials(): boolean {
  return !!(
    process.env.CLERK_TESTING_TOKEN ||
    (process.env.CLERK_TEST_USER_EMAIL && process.env.CLERK_TEST_USER_PASSWORD)
  )
}

/** Click a button and wait for network to settle */
export async function clickAndWait(page: Page, selector: string) {
  await page.click(selector)
  await page.waitForLoadState('networkidle')
}

/** Fill a form field by label text */
export async function fillField(page: Page, label: string, value: string) {
  await page.getByLabel(label).fill(value)
}

/** Assert a toast notification appeared */
export async function expectToast(page: Page, text: string | RegExp) {
  const toastLocator = page.locator('[data-sonner-toast]')
  await expect(toastLocator.filter({ hasText: text })).toBeVisible({ timeout: 5_000 })
}

/** Assert the page URL matches a pattern */
export async function expectURL(page: Page, pattern: string | RegExp) {
  await expect(page).toHaveURL(pattern, { timeout: 10_000 })
}

/** Drag an element to a target (for Kanban board) */
export async function dragTo(page: Page, source: string, target: string) {
  const sourceEl = page.locator(source).first()
  const targetEl = page.locator(target).first()

  const sourceBounds = await sourceEl.boundingBox()
  const targetBounds = await targetEl.boundingBox()

  if (!sourceBounds || !targetBounds) {
    throw new Error('Could not find source or target elements for drag')
  }

  await page.mouse.move(
    sourceBounds.x + sourceBounds.width / 2,
    sourceBounds.y + sourceBounds.height / 2
  )
  await page.mouse.down()

  // Move in steps to trigger drag handlers
  const steps = 5
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      sourceBounds.x + ((targetBounds.x - sourceBounds.x) * i) / steps,
      sourceBounds.y + ((targetBounds.y - sourceBounds.y) * i) / steps,
      { steps: 2 }
    )
  }

  await page.mouse.move(
    targetBounds.x + targetBounds.width / 2,
    targetBounds.y + targetBounds.height / 2
  )
  await page.mouse.up()
}
