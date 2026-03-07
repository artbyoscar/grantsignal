import { test, expect } from '@playwright/test'
import { waitForAppReady, expectURL, authenticateAndNavigate, hasAuthCredentials } from './helpers'

/**
 * E2E: Sign Up & Onboarding Flow
 *
 * Covers the complete new-user journey:
 * 1. Sign-up page renders Clerk component
 * 2. Sign-in page renders Clerk component
 * 3. Unauthenticated users are redirected to sign-in
 * 4. 6-step onboarding wizard (welcome -> org -> docs -> programs -> team -> complete)
 */

test.describe('Authentication', () => {
  test('sign-up page renders Clerk sign-up component', async ({ page }) => {
    await page.goto('/sign-up')
    // Clerk renders its own sign-up component
    await expect(page.locator('.cl-signUp-root')).toBeVisible({ timeout: 10_000 })
  })

  test('sign-in page renders Clerk sign-in component', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page.locator('.cl-signIn-root')).toBeVisible({ timeout: 10_000 })
  })

  test('unauthenticated users are redirected to sign-in', async ({ page }) => {
    await page.goto('/dashboard')
    await expectURL(page, /sign-in/)
  })

  test('unauthenticated access to pipeline redirects to sign-in', async ({ page }) => {
    await page.goto('/pipeline')
    await expectURL(page, /sign-in/)
  })

  test('public routes are accessible without auth', async ({ page }) => {
    // The home page is public
    const response = await page.goto('/')
    expect(response?.status()).toBeLessThan(400)
  })

  test('API webhooks route is public', async ({ page }) => {
    const response = await page.goto('/api/webhooks')
    // May return 405 (method not allowed for GET) but not 401/403
    expect(response?.status()).not.toBe(401)
    expect(response?.status()).not.toBe(403)
  })
})

test.describe('Onboarding Flow', () => {
  // These tests require authentication. Skip if no test credentials configured.
  test.skip(!hasAuthCredentials(), 'Requires CLERK_TESTING_TOKEN or email/password credentials')

  test.beforeEach(async ({ page }) => {
    await authenticateAndNavigate(page, '/onboarding')
  })

  test('Step 1: Welcome page shows Get Started and Skip options', async ({ page }) => {
    await page.goto('/onboarding')
    await waitForAppReady(page)

    // Should show welcome messaging
    await expect(page.getByText(/welcome/i)).toBeVisible()

    // Should have Get Started button
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible()

    // Should have Skip option
    await expect(page.getByRole('link', { name: /skip/i })).toBeVisible()
  })

  test('Step 1: Get Started navigates to organization step', async ({ page }) => {
    await page.goto('/onboarding')
    await waitForAppReady(page)

    await page.getByRole('link', { name: /get started/i }).click()
    await expectURL(page, /\/onboarding\/organization/)
  })

  test('Step 1: Skip navigates to dashboard', async ({ page }) => {
    await page.goto('/onboarding')
    await waitForAppReady(page)

    await page.getByRole('link', { name: /skip/i }).click()
    await expectURL(page, /\/dashboard/)
  })

  test('Step 2: Organization form has required fields', async ({ page }) => {
    await page.goto('/onboarding/organization')
    await waitForAppReady(page)

    // Organization name field
    await expect(page.getByLabel(/organization name/i)).toBeVisible()

    // EIN field
    await expect(page.getByLabel(/ein/i)).toBeVisible()

    // Mission field
    await expect(page.getByLabel(/mission/i)).toBeVisible()

    // Continue button
    await expect(page.getByRole('button', { name: /continue|next|save/i })).toBeVisible()
  })

  test('Step 2: Filling organization form and continuing', async ({ page }) => {
    await page.goto('/onboarding/organization')
    await waitForAppReady(page)

    await page.getByLabel(/organization name/i).fill('Test Nonprofit')
    await page.getByLabel(/mission/i).fill('To serve underserved communities through education')

    // Submit and navigate to documents step
    await page.getByRole('button', { name: /continue|next|save/i }).click()
    await expectURL(page, /\/onboarding\/documents/)
  })

  test('Step 3: Documents page shows upload area', async ({ page }) => {
    await page.goto('/onboarding/documents')
    await waitForAppReady(page)

    // Should show drag-and-drop upload area or upload button
    await expect(
      page.getByText(/upload|drag|drop|browse/i).first()
    ).toBeVisible()

    // Should have skip/continue option
    await expect(page.getByRole('button', { name: /continue|skip|next/i }).first()).toBeVisible()
  })

  test('Step 4: Programs page allows adding programs', async ({ page }) => {
    await page.goto('/onboarding/programs')
    await waitForAppReady(page)

    // Should have program name input
    await expect(page.getByLabel(/program name|name/i).first()).toBeVisible()

    // Should have add button
    await expect(page.getByRole('button', { name: /add/i }).first()).toBeVisible()
  })

  test('Step 5: Team page shows invite form', async ({ page }) => {
    await page.goto('/onboarding/team')
    await waitForAppReady(page)

    // Should have email input for invitations
    await expect(page.getByLabel(/email/i).first()).toBeVisible()

    // Should have role selection
    await expect(page.getByText(/admin|member|viewer/i).first()).toBeVisible()
  })

  test('Step 6: Complete page shows success and dashboard link', async ({ page }) => {
    await page.goto('/onboarding/complete')
    await waitForAppReady(page)

    // Should show completion messaging
    await expect(
      page.getByText(/complete|ready|all set|congratulations/i).first()
    ).toBeVisible()

    // Should have link to dashboard
    await expect(page.getByRole('link', { name: /dashboard|get started|go to/i })).toBeVisible()
  })
})
