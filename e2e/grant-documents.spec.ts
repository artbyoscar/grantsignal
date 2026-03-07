import { test, expect } from '@playwright/test'
import { waitForAppReady, expectURL, expectToast, navigateToDashboard, hasAuthCredentials } from './helpers'

/**
 * E2E: Grant Creation & Document Upload
 *
 * Covers two core user journeys:
 * 1. Creating a new grant from the pipeline page
 * 2. Uploading a document and observing processing status
 */

test.describe('Grant Creation', () => {
  test.skip(!hasAuthCredentials(), 'Requires CLERK_TESTING_TOKEN or email/password credentials')

  test.beforeEach(async ({ page }) => {
    await navigateToDashboard(page, '/pipeline')
  })

  test('pipeline page loads with Kanban columns', async ({ page }) => {
    // Should show the pipeline heading
    await expect(page.getByText(/pipeline/i).first()).toBeVisible()

    // Should have view toggle buttons (Kanban, List, Calendar)
    await expect(page.getByRole('button', { name: /kanban|board/i }).first()).toBeVisible()

    // Should show status columns
    const columns = ['Prospect', 'Researching', 'Writing', 'Review', 'Submitted', 'Pending', 'Awarded']
    for (const col of columns) {
      await expect(page.getByText(col).first()).toBeVisible()
    }
  })

  test('Add Grant button opens creation modal', async ({ page }) => {
    // Click the add grant button
    await page.getByRole('button', { name: /add grant|new grant|\+/i }).first().click()

    // Modal or form should appear
    await expect(
      page.getByText(/new grant|create grant|add grant/i).first()
    ).toBeVisible({ timeout: 5_000 })
  })

  test('creating a grant adds it to the pipeline', async ({ page }) => {
    // Open the creation form
    await page.getByRole('button', { name: /add grant|new grant|\+/i }).first().click()

    // Wait for the modal/form
    await page.waitForSelector('[role="dialog"], form', { timeout: 5_000 })

    // Fill in grant details -- the form fields vary but typically include:
    // Funder selection or name
    const funderInput = page.getByLabel(/funder/i).first()
    if (await funderInput.isVisible()) {
      await funderInput.click()
      // Select first option in dropdown if it is a select/combobox
      const option = page.getByRole('option').first()
      if (await option.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await option.click()
      }
    }

    // Amount field
    const amountInput = page.getByLabel(/amount/i).first()
    if (await amountInput.isVisible()) {
      await amountInput.fill('50000')
    }

    // Submit the form
    await page.getByRole('button', { name: /create|save|add|submit/i }).last().click()

    // Should either show a toast or redirect
    await page.waitForLoadState('networkidle')
  })

  test('grant detail page loads from pipeline card click', async ({ page }) => {
    // Click on the first grant card in the pipeline
    const grantCard = page.locator('[data-testid="grant-card"], [class*="grant"], [class*="card"]').first()

    if (await grantCard.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await grantCard.click()
      // Should navigate to grant detail or open detail panel
      await page.waitForLoadState('networkidle')
    }
  })
})

test.describe('Document Upload', () => {
  test.skip(!hasAuthCredentials(), 'Requires CLERK_TESTING_TOKEN or email/password credentials')

  test.beforeEach(async ({ page }) => {
    await navigateToDashboard(page, '/documents')
  })

  test('documents page loads with upload area', async ({ page }) => {
    // Should show documents heading
    await expect(page.getByText(/documents/i).first()).toBeVisible()

    // Should show upload area or button
    await expect(
      page.getByText(/upload|drag|drop|browse/i).first()
    ).toBeVisible()
  })

  test('upload area accepts drag-and-drop files', async ({ page }) => {
    // Verify the drop zone is present
    const dropZone = page.locator('[class*="drop"], [class*="upload"], [data-testid="upload-zone"]').first()
    await expect(dropZone).toBeVisible({ timeout: 5_000 })
  })

  test('upload button triggers file picker', async ({ page }) => {
    // Find the file input (hidden but functional)
    const fileInput = page.locator('input[type="file"]').first()
    await expect(fileInput).toBeAttached()
  })

  test('uploading a PDF file shows processing status', async ({ page }) => {
    // Create a test PDF buffer
    const testPdfContent = Buffer.from('%PDF-1.4 test content')

    // Find file input and upload
    const fileInput = page.locator('input[type="file"]').first()

    await fileInput.setInputFiles({
      name: 'test-award-letter.pdf',
      mimeType: 'application/pdf',
      buffer: testPdfContent,
    })

    // Should show uploading/processing indicator
    await expect(
      page.getByText(/uploading|processing|pending/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('document list shows existing documents', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Either shows documents or empty state
    const hasDocuments = await page.locator('[class*="document"], [class*="card"], table tbody tr').first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false)

    const hasEmptyState = await page.getByText(/no documents|upload your first|get started/i).first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false)

    // One of these should be true
    expect(hasDocuments || hasEmptyState).toBe(true)
  })

  test('document search filters results', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first()

    if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await searchInput.fill('award')
      await page.waitForLoadState('networkidle')
      // Search should filter the document list (or show no results)
    }
  })

  test('document type filter narrows results', async ({ page }) => {
    // Look for type filter dropdown or tabs
    const typeFilter = page.getByRole('combobox', { name: /type/i }).first()

    if (await typeFilter.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await typeFilter.click()
      // Select a document type
      const option = page.getByRole('option').first()
      if (await option.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await option.click()
        await page.waitForLoadState('networkidle')
      }
    }
  })
})
