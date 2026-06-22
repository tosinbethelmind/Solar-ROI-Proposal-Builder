import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home page has main heading and is accessible', async ({ page }) => {
  await page.goto('/');
  const heading = await page.locator('h1');
  await expect(heading).toHaveText(/Quote Nigerian solar projects/i);
  await expect(page.locator('text=SolarQuotePro').first()).toBeVisible();
  // Run accessibility audit
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
