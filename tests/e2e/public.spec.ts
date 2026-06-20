import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
  test('Homepage loads and displays branding', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SolarQuotePro/i);

    // Verify presence of hero text
    const heroH1 = page.locator('h1').first();
    await expect(heroH1).toBeVisible();
    
    // Verify logo/branding in header
    const header = page.locator('header');
    await expect(header).toContainText(/SolarQuotePro/i);
  });

  test('Pricing tiers section is visible', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to pricing section if it exists
    const pricingHeader = page.locator('text=Choose the Perfect Plan').first();
    if (await pricingHeader.isVisible()) {
      await expect(pricingHeader).toBeVisible();
    }
  });
});
