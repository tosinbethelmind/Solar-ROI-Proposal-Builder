const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[BROWSER EXCEPTION]: ${err.message}`));

  try {
    console.log('Navigating to estimator...');
    await page.goto('http://localhost:3000/estimator');
    await page.waitForTimeout(2000);

    console.log('Toggling heavy loads switch...');
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.locator('xpath=..').click();
    await page.waitForTimeout(1000);

    console.log('Locating Deep Freezer card with exact regex match...');
    const freezerCard = page.locator('p', { hasText: /^Deep Freezer$/ }).locator('xpath=ancestor::div[contains(@class, "border")][1]');
    
    const count = await freezerCard.count();
    console.log(`Found ${count} Deep Freezer card(s).`);
    
    if (count > 0) {
      const isVisible = await freezerCard.isVisible();
      console.log('Is freezer card visible?', isVisible);
      
      const btn = freezerCard.locator('button:has-text("+")');
      console.log('Clicking the "+" button...');
      await btn.click();
      console.log('Click completed!');
      await page.waitForTimeout(1000);
      
      const text = await freezerCard.evaluate(el => el.innerText);
      console.log('Freezer card content after click:', text);
    }
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
