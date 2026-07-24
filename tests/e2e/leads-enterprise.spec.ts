import { test, expect } from '@playwright/test';

test.describe('Admin Leads Dashboard & B2B Compliance', () => {
  test('should load the dashboard and allow managing homeowner and enterprise leads', async ({ page, context, baseURL }) => {
    // Set 2 minutes timeout for cold compilation on Windows
    test.setTimeout(120000);

    // Inject local dev bypass cookies using the correct hostname
    const cookieDomain = baseURL ? new URL(baseURL).hostname : 'localhost';
    console.log(`[E2E] Injecting cookies with domain: ${cookieDomain}`);
    
    await context.addCookies([
      {
        name: 'bypass_auth',
        value: 'solar-quotepro-e2e-secret-key-2026',
        domain: cookieDomain,
        path: '/'
      },
      {
        name: 'bypass_admin_role',
        value: 'superadmin',
        domain: cookieDomain,
        path: '/'
      }
    ]);

    // 1. Visit the Admin Leads Dashboard
    page.on('pageerror', (err) => {
      console.error(`[Browser PageError] ${err.message}\nStack: ${err.stack}`);
    });
    page.on('console', (msg) => {
      console.log(`[Browser Console] [${msg.type()}] ${msg.text()}`);
    });

    await page.goto('/admin/leads');
    await page.waitForLoadState('networkidle');
    console.log(`[E2E] Page loaded. Current URL: ${page.url()}`);

    // Assert that the homeowner title is visible
    await expect(page.getByText('Sizer Capture Console')).toBeVisible({ timeout: 60000 });

    // 2. Switch to B2B Enterprise Leads tab
    await page.getByRole('button', { name: 'B2B Enterprise Leads' }).click();

    // Verify title updates
    await expect(page.getByText('Enterprise Sizer & Compliance Dashboard')).toBeVisible({ timeout: 20000 });

    // Verify presence of enterprise lead "Acme Corp Ltd"
    const enterpriseRow = page.locator('tr:has-text("Acme Corp Ltd")').first();
    await expect(enterpriseRow).toBeVisible();

    // 3. Click the lead row to select it
    await enterpriseRow.click();

    // Verify outreach copilot updates
    await expect(page.getByText('Active Corporate Lead')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Acme Corp Ltd' })).toBeVisible();

    // 4. Change target compliance city to "abuja"
    const citySelect = page.locator('select').first(); // the first select inside the detail card
    await citySelect.selectOption('abuja');

    // 5. Change status dropdown to "contacted"
    // The status select inside the row
    const statusSelect = enterpriseRow.locator('select');
    await statusSelect.selectOption('contacted');

    // Wait a brief moment for persistence
    await page.waitForTimeout(1500);

    // Verify status updates - reload to confirm persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    console.log(`[E2E] Page reloaded. Current URL: ${page.url()}`);
    
    // Switch to B2B tab again
    await page.getByRole('button', { name: 'B2B Enterprise Leads' }).click();
    await expect(enterpriseRow.locator('select')).toHaveValue('contacted');
  });
});
