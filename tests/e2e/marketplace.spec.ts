import { test, expect } from '@playwright/test';

test.describe('Admin Marketplace Dashboard & RBAC Gating', () => {
  test.beforeEach(async ({ context }) => {
    // Inject local dev bypass cookies
    await context.addCookies([
      {
        name: 'bypass_auth',
        value: 'solar-quotepro-e2e-secret-key-2026',
        domain: 'localhost',
        path: '/'
      },
      {
        name: 'bypass_admin_role',
        value: 'superadmin',
        domain: 'localhost',
        path: '/'
      },
      {
        name: 'bypass_auth',
        value: 'solar-quotepro-e2e-secret-key-2026',
        domain: '127.0.0.1',
        path: '/'
      },
      {
        name: 'bypass_admin_role',
        value: 'superadmin',
        domain: '127.0.0.1',
        path: '/'
      }
    ]);
  });

  test('should load the dashboard and gate UI actions by administrative role', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER EXCEPTION:', err.message));

    // 1. Visit the Admin Marketplace Dashboard
    console.log('CONTEXT COOKIES:', await page.context().cookies());
    await page.goto('/admin/marketplace');
    console.log('BROWSER DOCUMENT.COOKIE:', await page.evaluate(() => document.cookie));

    // Assert that the page header loads
    await expect(page.getByText(/marketplace center/i)).toBeVisible({ timeout: 15000 });
    
    // 2. Test Tab Navigation
    await page.getByRole('button', { name: 'Leads Control' }).click();
    await expect(page.getByText('Lead Routing Control Console')).toBeVisible();

    await page.getByRole('button', { name: '⚙️ Team & Security' }).click();
    await expect(page.getByText('Team & Access Control Settings')).toBeVisible();

    // 3. Test Operations & Verification Tab
    await page.getByRole('button', { name: '⚡ Operations Automation' }).click();
    await expect(page.getByText('Operations & Verification Automation Queue')).toBeVisible();

    // 4. Test simulated role change to Read-Only
    await page.getByRole('button', { name: 'READ_ONLY' }).click();
    // In read-only mode, the Sheet Sync button should be disabled
    const syncButton = page.getByRole('button', { name: 'Sync Registered Installers' });
    await expect(syncButton).toBeDisabled();

    // 5. Test simulated role change to SuperAdmin
    await page.getByRole('button', { name: 'SUPERADMIN' }).click();
    await expect(syncButton).toBeEnabled();

    // 6. Test Offline Receipt Analyzer OCR
    await page.getByRole('button', { name: 'LOAD MOCK' }).first().click();
    // Textarea should contain text
    const textVal = await page.locator('textarea').inputValue();
    expect(textVal.length).toBeGreaterThan(50);

    // Run AI OCR Extraction
    await page.getByRole('button', { name: 'Run AI OCR Extraction' }).click();
    
    // Extracted payment details should become visible
    await expect(page.getByText('Extracted Payment Details')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Depositor Name')).toBeVisible();
    await expect(page.getByText('Amount Extracted')).toBeVisible();
  });
});
