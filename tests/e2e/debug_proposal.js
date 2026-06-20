const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log all console messages
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  // Log all page errors (uncaught exceptions)
  page.on('pageerror', err => {
    console.error(`[BROWSER EXCEPTION]: ${err.message}`);
    console.error(err.stack);
  });

  // Save screenshots outside of workspace
  const scratchDir = 'C:\\Users\\HomePC\\.gemini\\antigravity\\brain\\5d886bc3-cbed-447a-a071-405ef01f132a\\scratch';
  const beforeImg = path.join(scratchDir, 'step5-before-click.png');
  const afterImg = path.join(scratchDir, 'step5-after-click.png');

  try {
    console.log('Injecting auth bypass cookie...');
    await context.addCookies([{
      name: 'bypass_auth',
      value: 'solar-quotepro-e2e-secret-key-2026',
      domain: 'localhost',
      path: '/'
    }]);

    console.log('Navigating to workspace...');
    await page.goto('http://localhost:3000/workspace');
    await page.waitForTimeout(2000);

    console.log('Switching to Pro mode...');
    const proBtn = page.locator('button:has-text("Pro")').first();
    await proBtn.click();
    await page.waitForTimeout(1000);

    console.log('Opening full wizard setup...');
    await page.getByRole('button', { name: /Full Wizard Setup/i }).click();
    await page.waitForURL('**/proposals/new?type=wizard');
    console.log('Wizard URL loaded:', page.url());

    // Step 1: Add appliances
    console.log('Step 1: Adding TV and Fridge...');
    await page.getByRole('button', { name: '📺 LED TV' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: '🥶 Fridge/Freezer' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Next: System Preferences/i }).click();
    await page.waitForTimeout(1000);

    // Step 2: Preferences
    console.log('Step 2: Filling in tariffs...');
    await page.locator('#petrol-price').fill('1250');
    await page.locator('#diesel-price').fill('1750');
    await page.locator('#monthly-phcn').fill('20000');
    await page.locator('#monthly-gen-fuel').fill('100000');
    await page.getByRole('button', { name: /Next: Hardware Selection/i }).click();
    await page.waitForTimeout(1000);

    // Step 3: Hardware
    console.log('Step 3: Selecting economy...');
    await page.getByRole('button', { name: 'Select Economy' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Continue to ROI' }).click();
    await page.waitForTimeout(1000);

    // Step 4: ROI
    console.log('Step 4: Setting margins...');
    await page.locator('input[placeholder="80\\,000"]').fill('90000');
    await page.locator('input[placeholder="25\\,000"]').fill('30000');
    await page.locator('input[placeholder="15"]').fill('20');
    const vatCheckbox = page.locator('#simple_vat');
    await vatCheckbox.check();
    await page.getByRole('button', { name: 'Save & Update Pricing' }).click();
    await page.waitForTimeout(1000);

    // Step 5: Finalize
    console.log('Step 5: Finalizing...');
    await page.locator('input[placeholder="e.g. John Doe"]').fill('Lagos Heights Apartments');
    await page.locator('input[placeholder="john@example.com"]').fill('manager@lagosheights.com');
    await page.getByRole('button', { name: /Installer Branding/i }).click();
    await page.locator('input[placeholder="e.g. Powering Nigeria\'s Future"]').fill('Reliable Clean Power for Nigeria');
    await page.waitForTimeout(1000);

    console.log('Taking screenshot of Step 5 before click...');
    await page.screenshot({ path: beforeImg });

    console.log('Clicking "Generate PDF Proposal"...');
    await page.getByRole('button', { name: 'Generate PDF Proposal' }).click();

    console.log('Waiting 8 seconds for URL to transition or errors to print...');
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(1000);
      console.log(`Current URL at ${i+1}s:`, page.url());
    }

    console.log('Taking screenshot after click...');
    await page.screenshot({ path: afterImg });

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
