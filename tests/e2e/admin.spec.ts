import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Navigation', () => {
  // Use the pre-authenticated admin state
  test.use({ storageState: 'tests/e2e/.auth/admin.json' });

  test('loads dashboard and navigates to proposals, companies, and fx-rates', async ({ page }) => {
    // 1. Load admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Verify dashboard heading
    const dashboardHeader = page.getByRole('heading', { name: 'SolarQuotePro Dashboard' });
    await expect(dashboardHeader).toBeVisible({ timeout: 20000 });

    // 2. Navigate to Proposals Vault
    await page.getByRole('link', { name: 'Solar Proposals' }).click();
    await page.waitForLoadState('networkidle');
    const proposalsHeader = page.getByRole('heading', { name: 'Proposals Vault' });
    await expect(proposalsHeader).toBeVisible({ timeout: 20000 });

    // 3. Navigate to Companies Registry
    await page.getByRole('link', { name: 'Installer Workspaces' }).click();
    await page.waitForLoadState('networkidle');
    const companiesHeader = page.getByRole('heading', { name: 'Companies Registry' });
    await expect(companiesHeader).toBeVisible({ timeout: 20000 });

    // 4. Navigate to FX Override Manager
    await page.getByRole('link', { name: 'FX Override Manager' }).click();
    await page.waitForLoadState('networkidle');
    const fxHeader = page.getByRole('heading', { name: 'FX Override Manager' });
    await expect(fxHeader).toBeVisible({ timeout: 20000 });
  });
});
