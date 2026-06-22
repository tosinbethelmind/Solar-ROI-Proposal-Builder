import { test, expect } from '@playwright/test';

test.describe('SolarQuotePro App Walkthrough Demo Video', () => {
  // Instruct Playwright to always record video for this specific test
// Video recording configuration moved to playwright.config.ts (removed test.use)

  test('Walkthrough estimator sizer and admin leads', async ({ page, context }) => {
    // 1. Navigate to self-service sizer page
    console.log('Navigating to estimator sizer...');
    await page.goto('/estimator');
    await page.waitForTimeout(2000); // Allow loading animations to settle

    // 2. Add some appliances
    console.log('Adding appliances to Step 1...');
    
    // Add 1 Smart TV & Sound System
    // Wait for the Smart TV & Sound System card to be visible
    await page.waitForSelector('div:has-text("Smart TV & Sound System")');
    const tvCard = page.locator('div', { hasText: 'Smart TV & Sound System' }).first();
    await tvCard.locator('button', { hasText: '+' }).click({ timeout: 45000 });
    await page.waitForTimeout(1000);

    // Toggle the heavy loads switch to show deep freezer and ACs
    console.log('Toggling heavy loads switch...');
    const heavySwitch = page.getByRole('switch');
    await heavySwitch.click();
    await page.waitForTimeout(1000);

    // Add 1 Deep Freezer
    const freezerCard = page.locator('div', { hasText: 'Deep Freezer' }).last();
    await freezerCard.locator('button:has-text("+")').click();
    await page.waitForTimeout(1000);

    // Click "Next Step" to proceed to Step 2
    console.log('Proceeding to Step 2 (Usage & Tariffs)...');
    await page.getByRole('button', { name: /Next Step/i }).click();
    await page.waitForTimeout(1500);

    // 3. Fill in fuel expenses
    console.log('Setting generator spend...');
    const fuelInput = page.getByPlaceholder('e.g. 60,000');
    await fuelInput.fill('150000');
    await page.waitForTimeout(1500);

    // Click "Calculate Recommendations"
    console.log('Clicking Calculate Recommendations to trigger lead capture...');
    await page.getByRole('button', { name: /Calculate Recommendations/i }).click();
    await page.waitForTimeout(1500);

    // 4. Handle lead capture modal intercept
    console.log('Filling out lead capture form...');
    const emailInput = page.getByPlaceholder('e.g. name@company.com');
    await emailInput.fill('anthony_demo@gmail.com');
    await page.waitForTimeout(1500);

    // Click submit button
    console.log('Submitting lead...');
    await page.getByRole('button', { name: /Get Sizing & ₦120k Bundle via Email/i }).click();
    await page.waitForTimeout(2000);

    // 5. Scroll through sizing results
    console.log('Viewing Sizing Report (Step 3)...');
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await page.waitForTimeout(2000);

    // 6. Set auth bypass cookie and navigate to Admin leads dashboard
    console.log('Injecting auth bypass cookie...');
    const cookieDomain = new URL(page.url()).hostname;
    await context.addCookies([{
      name: 'bypass_auth',
      value: 'solar-quotepro-e2e-secret-key-2026',
      domain: cookieDomain,
      path: '/'
    }]);

    console.log('Navigating to admin leads dashboard...');
    await page.goto('/admin/leads');
    await page.waitForTimeout(3000);

    // 7. Select the captured lead from the grid
    console.log('Selecting anthony_demo@gmail.com lead...');
    const leadRow = page.locator('tr:has-text("anthony_demo@gmail.com")').first();
    await leadRow.click();
    await page.waitForTimeout(3000); // Wait for the AI Copilot to generate first script

    // 8. Toggle outreach tabs in the AI Copilot
    console.log('Toggling to Email Outreach tab...');
    await page.getByRole('button', { name: /Email/i }).first().click();
    await page.waitForTimeout(3000);

    console.log('Toggling to Call Outreach tab...');
    await page.getByRole('button', { name: /Call/i }).first().click();
    await page.waitForTimeout(3000);

    console.log('Demo walkthrough complete!');
  });
});
