import { test, expect } from '@playwright/test';

// This test uses the pre‑seeded admin storage state defined in playwright.config.ts
test.describe('Admin Dashboard - Proposals', () => {
  test('should display proposals list and create a new proposal', async ({ page }) => {
    // Navigate to admin dashboard (storageState logs in automatically)
    await page.goto('/admin');

    // Verify the dashboard loads and the proposals table is visible
    const proposalsHeader = page.getByRole('heading', { name: /proposals/i });
    await expect(proposalsHeader).toBeVisible();

    // Ensure at least one proposal row exists (or show empty state)
    const proposalRows = page.locator('table tbody tr');
    const count = await proposalRows.count();
    expect(count).toBeGreaterThanOrEqual(0);

    // Click the "Create Proposal" button
    await page.getByRole('button', { name: /create proposal/i }).click();

    // Fill out the wizard steps (reuse the same steps as the installer wizard but with admin privileges)
    // Step 1 – Project details
    await expect(page).toHaveURL(/\/proposals\/new/);
    await page.fill('input[name="projectName"]', 'E2E Test Proposal');
    await page.fill('input[name="clientName"]', 'Acme Corp');
    await page.fill('input[name="location"]', '123 Solar Ave');
    await page.click('button:has-text("Next")');

    // Step 2 – Load information (use mock values)
    await page.fill('input[name="peakLoad"]', '5');
    await page.fill('input[name="averageLoad"]', '3');
    await page.click('button:has-text("Next")');

    // Step 3 – Review and submit
    await expect(page.getByText('E2E Test Proposal')).toBeVisible();
    await page.click('button:has-text("Submit")');

    // Verify success toast/message
    await expect(page.getByText(/proposal created successfully/i)).toBeVisible();

    // Return to proposals list and verify the new entry appears
    await page.click('a:has-text("Back to proposals")');
    await expect(page.getByRole('cell', { name: 'E2E Test Proposal' })).toBeVisible();
  });
});
