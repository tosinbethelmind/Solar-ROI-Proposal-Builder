import { test, expect } from '@playwright/test';

test.describe('Installer Workspace', () => {
  // Playwright project 'installer' uses installer.json as its storageState, 
  // so these tests start already authenticated.

  test('Workspace dashboard loads successfully', async ({ page }) => {
    await page.goto('/workspace');
    
    // Ensure we are indeed on the workspace page and not redirected to login
    await expect(page).toHaveURL(/\/workspace/);
    
    // Check for dashboard greeting or key content
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('Workspace CRM redirects to History page without 404', async ({ page }) => {
    await page.goto('/workspace/crm');
    
    // Check that we transitioned to the history page
    await expect(page).toHaveURL(/\/history/);
    
    // Ensure it is not a 404 page
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.toLowerCase()).not.toContain('404');
    expect(bodyText.toLowerCase()).not.toContain('not found');
  });

  test('Proposal wizard renders successfully', async ({ page }) => {
    await page.goto('/proposals/new?type=wizard');
    
    // Check that key wizard elements are visible (like search appliances input or Next button)
    await expect(page.locator('input[placeholder*="Search"]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Next/i }).first()).toBeVisible();
  });
});
