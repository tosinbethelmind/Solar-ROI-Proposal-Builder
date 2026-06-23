const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// URLs to test
const urls = [
  'https://solar-roi-proposal-builder-betelmindrecruit-9250s-projects.vercel.app/',
  'https://solar-roi-proposal-builder-betelmindrecruit-9250s-projects.vercel.app/homepage'
];

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Ensure screenshots folder exists
  const screenshotDir = path.resolve(__dirname, 'theme_screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);

  for (const url of urls) {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    // Light mode screenshot (default)
    await page.screenshot({ path: path.join(screenshotDir, `${url.replace(/[:\/]/g, '_')}_light.png`) });
    // Toggle theme – look for a button with aria-label or data-theme-toggle
    try {
      const toggle = await page.$('[data-theme-toggle], button[aria-label*="theme"], .theme-toggle');
      if (toggle) {
        await toggle.click();
        await page.waitForTimeout(1000); // wait for UI update
      }
    } catch (e) {
      console.error('Theme toggle not found:', e);
    }
    // Dark mode screenshot
    await page.screenshot({ path: path.join(screenshotDir, `${url.replace(/[:\/]/g, '_')}_dark.png`) });
  }

  await browser.close();
  console.log('Theme verification screenshots saved to', screenshotDir);
})();
