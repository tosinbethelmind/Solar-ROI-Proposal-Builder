import { test, expect } from '@playwright/test';

// Instruct Playwright to always record video for this specific test
// Video recording configuration moved to playwright.config.ts

// Helper to inject a visual cursor into the page
async function injectCursor(page: any) {
  await page.evaluate(() => {
    if (document.getElementById('playwright-mock-cursor')) return;
    const cursor = document.createElement('div');
    cursor.id = 'playwright-mock-cursor';
    cursor.style.position = 'fixed';
    cursor.style.width = '18px';
    cursor.style.height = '18px';
    cursor.style.backgroundColor = 'rgba(20, 184, 166, 0.85)'; // Teal-500
    cursor.style.borderRadius = '50%';
    cursor.style.border = '2px solid white';
    cursor.style.boxShadow = '0 3px 10px rgba(0,0,0,0.5)';
    cursor.style.zIndex = '9999999';
    cursor.style.pointerEvents = 'none';
    cursor.style.transform = 'translate(-50%, -50%)';
    cursor.style.left = '50%';
    cursor.style.top = '50%';
    cursor.style.transition = 'left 0.5s cubic-bezier(0.25, 1, 0.5, 1), top 0.5s cubic-bezier(0.25, 1, 0.5, 1), transform 0.1s ease-out';
    document.body.appendChild(cursor);
  });
}

// Move visual cursor to center of element
async function moveCursorTo(page: any, locator: any) {
  await injectCursor(page);
  let box = null;
  try {
    box = await locator.first().boundingBox();
  } catch (e) {}
  
  if (box) {
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.evaluate(({ x, y }) => {
      const cursor = document.getElementById('playwright-mock-cursor');
      if (cursor) {
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
      }
    }, { x, y });
    await page.waitForTimeout(500); // Allow cursor to glide to position
  }
}

// Visual click helper
async function clickWithCursor(page: any, locator: any) {
  await moveCursorTo(page, locator);
  await page.evaluate(() => {
    const cursor = document.getElementById('playwright-mock-cursor');
    if (cursor) {
      cursor.style.transform = 'translate(-50%, -50%) scale(0.65)';
    }
  });
  await page.waitForTimeout(150);
  await locator.first().click();
  await page.evaluate(() => {
    const cursor = document.getElementById('playwright-mock-cursor');
    if (cursor) {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  });
  await page.waitForTimeout(350);
}

// Visual text filling helper
async function fillWithCursor(page: any, locator: any, text: string) {
  await moveCursorTo(page, locator);
  await locator.first().focus();
  await page.waitForTimeout(150);
  await locator.first().fill(text);
  await page.waitForTimeout(300);
}

// Helper to speak using Web Speech API and wait for it to finish
async function speak(page: any, msg: string, isHeadless: boolean) {
  console.log(`[SPEECH]: ${msg}`);
  
  if (isHeadless) {
    return; // Bypass immediately in headless mode to run E2E at full speed
  }
  
  const speechPromise = page.evaluate((text: string) => {
    return new Promise<void>((resolve) => {
      try {
        if (!('speechSynthesis' in window)) {
          resolve();
          return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05; // slightly faster for responsiveness
        utterance.pitch = 1.0;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
        // Browser-side safety timeout
        setTimeout(resolve, 12000);
      } catch (e) {
        resolve();
      }
    });
  }, msg);

  // Race with a 15-second Node-side safety timeout to prevent Playwright hangs
  await Promise.race([
    speechPromise.catch(() => {}),
    new Promise<void>((resolve) => setTimeout(resolve, 15000))
  ]);
  
  await page.waitForTimeout(1000); // Small pause after speaking
}

test.describe('SolarQuotePro Complete Platform Walkthrough Demo', () => {
  
  test('01_full_voiced_platform_walkthrough', async ({ page, context, baseURL }, testInfo) => {
    test.setTimeout(480000); // 8 minutes timeout to account for headed speech and multiple transitions

    // Detect headless mode robustly
    const isHeadless = testInfo.project.use.headless !== false && !process.argv.includes('--headed');
    console.log(`[WALKTHROUGH] Running in ${isHeadless ? 'HEADLESS' : 'HEADED'} mode.`);

    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });

    // ==========================================
    // 1. PUBLIC HOMEOWNER ESTIMATOR SIZER
    // ==========================================
    console.log('Injecting auth bypass cookie...');
    const cookieDomain = baseURL ? new URL(baseURL).hostname : 'localhost';
    await context.addCookies([{
      name: 'bypass_auth',
      value: 'solar-quotepro-e2e-secret-key-2026',
      domain: cookieDomain,
      path: '/'
    }]);

    console.log('Navigating to homeowner estimator sizer...');
    await page.goto('/estimator');
    await page.waitForTimeout(2000);
    await injectCursor(page);

    await speak(page, "Welcome to SolarQuotePro! Let's calculate the perfect hybrid solar system size for your home.", isHeadless);

    console.log('Adding appliances to Step 1...');
    await speak(page, "First, let's select our home appliances. We will add a Smart TV and Sound System to our daily loads.", isHeadless);
    
    // Add 1 Smart TV & Sound System
    const tvCard = page.locator('p', { hasText: /^Smart TV & Sound System$/ }).locator('xpath=ancestor::div[contains(@class, "border")][1]');
    await clickWithCursor(page, tvCard.locator('button:has-text("+")'));

    await speak(page, "Now, we toggle the heavy loads switch to show larger power appliances, like deep freezers and air conditioners.", isHeadless);

    // Toggle heavy loads switch
    const heavySwitchInput = page.locator('input[type="checkbox"]').first();
    await clickWithCursor(page, heavySwitchInput.locator('xpath=..'));

    await speak(page, "Next, let's add one deep freezer to our sizing configuration.", isHeadless);

    // Add 1 Deep Freezer
    const freezerCard = page.locator('p', { hasText: /^Deep Freezer$/ }).locator('xpath=ancestor::div[contains(@class, "border")][1]');
    await clickWithCursor(page, freezerCard.locator('button:has-text("+")'));

    await speak(page, "We are ready to proceed to the next step, where we configure our power usage and generator expenses.", isHeadless);

    // Click "Next Step" to proceed to Step 2
    await clickWithCursor(page, page.getByRole('button', { name: /Next Step/i }));

    console.log('Setting generator spend...');
    await speak(page, "Here, we will enter our current monthly generator fuel spend. Let's set it to 150,000 Naira to evaluate generator displacement ROI.", isHeadless);
    
    const fuelInput = page.getByPlaceholder('e.g. 60,000');
    await fillWithCursor(page, fuelInput, '150000');

    // ==========================================
    // 2. LEAD CAPTURE & REPORT DISPLAY
    // ==========================================
    await speak(page, "Now we click Calculate Recommendations to evaluate the options. This brings up the lead capture form.", isHeadless);
    await clickWithCursor(page, page.getByRole('button', { name: /Calculate Recommendations/i }));

    await speak(page, "Let's fill out our contact email to receive a detailed PDF proposal and claim a 120,000 Naira discount bundle.", isHeadless);
    const emailInput = page.getByPlaceholder('e.g. name@company.com');
    await fillWithCursor(page, emailInput, 'anthony_demo@gmail.com');

    await speak(page, "We submit the details to generate our instant solar savings audit report.", isHeadless);
    await clickWithCursor(page, page.getByRole('button', { name: /Get Sizing & ₦120k Bundle via Email/i }));
    await page.waitForTimeout(3000);

    await speak(page, "Success! We can see our customized hybrid solar recommendation report. Let's scroll down to view our estimated energy offset and carbon metrics.", isHeadless);
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await page.waitForTimeout(2000);

    // ==========================================
    // 3. INSTALLER WORKSPACE (SIMPLE / PRO MODES)
    // ==========================================
    await speak(page, "Now, let's transition to the Installer Workspace. Installers use their secure dashboard to manage client proposals and monitor pipeline metrics.", isHeadless);
    
    console.log('Navigating to installer workspace...');
    await page.goto('/workspace');
    await page.waitForTimeout(2500);
    await injectCursor(page);

    await speak(page, "Here is the simple mode workspace. We can easily toggle to Pro Mode to reveal live KPI stats like average system size, quoted revenue, and active plans.", isHeadless);
    
    // Toggle Pro Mode
    console.log('Switching to Pro mode...');
    await clickWithCursor(page, page.locator('button:has-text("Pro")').first());

    // ==========================================
    // 4. 5-STEP INSTALLER PROPOSAL WIZARD
    // ==========================================
    await speak(page, "Now, we will build a comprehensive, high-fidelity solar proposal using the 5-step installer wizard.", isHeadless);
    
    console.log('Opening full wizard setup...');
    await clickWithCursor(page, page.getByRole('button', { name: /Full Wizard Setup/i }));
    await page.waitForURL('**/proposals/new?type=wizard', { waitUntil: 'commit' });
    await injectCursor(page);

    // --- STEP 1: Load Profiling ---
    await speak(page, "In Step 1, we compile the client's energy profile. Let's add an LED TV and a fridge-freezer to our system.", isHeadless);
    await clickWithCursor(page, page.getByRole('button', { name: '📺 LED TV' }));
    await clickWithCursor(page, page.getByRole('button', { name: '🥶 Fridge/Freezer' }));
    
    await clickWithCursor(page, page.getByRole('button', { name: /Next: System Preferences/i }));

    // --- STEP 2: Preferences & Tariffs ---
    await speak(page, "Step 2 allows us to specify current energy pricing parameters. We'll set petrol to 1,250 Naira, diesel to 1,750 Naira, and monthly legacy bills to calculate utility displacement.", isHeadless);
    
    await fillWithCursor(page, page.locator('#petrol-price'), '1250');
    await fillWithCursor(page, page.locator('#diesel-price'), '1750');
    await fillWithCursor(page, page.locator('#monthly-phcn'), '20000');
    await fillWithCursor(page, page.locator('#monthly-gen-fuel'), '100000');

    await clickWithCursor(page, page.getByRole('button', { name: /Next: Hardware Selection/i }));

    // --- STEP 3: Hardware Selection ---
    await speak(page, "In Step 3, we select the hardware tier. We'll proceed with the Economy solar package which automatically compiles the Bill of Materials.", isHeadless);
    
    await clickWithCursor(page, page.getByRole('button', { name: 'Select Economy' }));
    await clickWithCursor(page, page.getByRole('button', { name: 'Continue to ROI' }));

    // --- STEP 4: ROI & Margins ---
    await speak(page, "In Step 4, we configure installer margins, transport logistics, and taxes. Let's set our installation labor to 90,000, logistics to 30,000, and profit margin to 20 percent.", isHeadless);
    
    await fillWithCursor(page, page.locator('input[placeholder="80\\,000"]'), '90000');
    await fillWithCursor(page, page.locator('input[placeholder="25\\,000"]'), '30000');
    await fillWithCursor(page, page.locator('input[placeholder="15"]'), '20');

    await speak(page, "We will check the VAT option to apply the standard seven point five percent VAT.", isHeadless);
    const vatCheckbox = page.locator('#simple_vat');
    await clickWithCursor(page, vatCheckbox);

    await clickWithCursor(page, page.getByRole('button', { name: 'Save & Update Pricing' }));

    // --- STEP 5: Finalize & Brand ---
    await speak(page, "Finally, in Step 5, we input client details and customize the installer branding tagline. Let's name the client Lagos Heights Apartments.", isHeadless);
    
    await fillWithCursor(page, page.locator('input[placeholder="e.g. John Doe"]'), 'Lagos Heights Apartments');
    await fillWithCursor(page, page.locator('input[placeholder="john@example.com"]'), 'manager@lagosheights.com');

    await speak(page, "Let's expand the installer branding section and add our customized company slogan: Reliable Clean Power for Nigeria.", isHeadless);
    await clickWithCursor(page, page.getByRole('button', { name: /Installer Branding/i }));
    await fillWithCursor(page, page.locator('input[placeholder="e.g. Powering Nigeria\'s Future"]'), 'Reliable Clean Power for Nigeria');

    await speak(page, "Now, let's generate the official PDF proposal for the client.", isHeadless);
    await clickWithCursor(page, page.getByRole('button', { name: 'Generate PDF Proposal' }));
    await page.waitForTimeout(3000);

    // ==========================================
    // 5. PDF PRINT PREVIEW
    // ==========================================
    await expect(page).toHaveURL(/\/proposals\/print/, { timeout: 35000 });
    await injectCursor(page);
    await speak(page, "The high-fidelity solar proposal has been generated! Let's scroll down to inspect the clean layout, standard equipment BOM, and payback calculations.", isHeadless);
    
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await page.waitForTimeout(2000);

    // ==========================================
    // 6. CRM HISTORY LOG
    // ==========================================
    await speak(page, "Let's check the CRM and proposal history log to see all our saved proposal drafts.", isHeadless);
    await page.goto('/history');
    await page.waitForTimeout(2000);
    await injectCursor(page);

    await speak(page, "Here we can see our saved Lagos Heights proposal, its status, and action logs.", isHeadless);
    await page.waitForTimeout(1500);

    // ==========================================
    // 7. SUBSCRIPTION PRICING PLANS
    // ==========================================
    await speak(page, "Now, let's check the pricing plans available for solar installers on our platform.", isHeadless);
    await page.goto('/pricing');
    await page.waitForTimeout(2000);
    await injectCursor(page);

    await speak(page, "Installers can choose between Free, Starter, Pro, or Enterprise plans depending on their sizing volume and lead outreach needs.", isHeadless);
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
    await page.waitForTimeout(2000);

    // ==========================================
    // 8. ADMIN OPERATIONS COMMAND
    // ==========================================
    await speak(page, "Next, we transition to the Admin Console to view system telemetry and lead engagement analytics.", isHeadless);
    await page.goto('/admin');
    await page.waitForTimeout(2500);
    await injectCursor(page);

    await speak(page, "The Admin Dashboard displays key operational statistics, monthly recurring revenue, platform signups, and service health logs.", isHeadless);
    await page.waitForTimeout(2000);

    // ==========================================
    // 9. ADMIN PARTNER COMPANIES
    // ==========================================
    await speak(page, "Let's navigate to the Companies manager to view and authorize active installer companies.", isHeadless);
    await page.goto('/admin/companies');
    await page.waitForTimeout(2000);
    await injectCursor(page);

    await speak(page, "Here we can review and manage subscriptions, edit member limits, or toggle suspended status for partner firms.", isHeadless);
    await page.waitForTimeout(1550);

    // ==========================================
    // 10. ADMIN SCRAPER ENGINE
    // ==========================================
    await speak(page, "We also have a built-in scraper engine to identify commercial prospects on Google Maps and Jiji who need solar installations.", isHeadless);
    await page.goto('/admin/scrapers');
    await page.waitForTimeout(2000);
    await injectCursor(page);

    await speak(page, "Administrators can initiate localized scrapers to populate the installer sales pipelines automatically.", isHeadless);
    await page.waitForTimeout(1500);

    // ==========================================
    // 11. ADMIN LEADS & AI CO-PILOT OUTREACH
    // ==========================================
    await speak(page, "Finally, let's inspect the lead database and check the AI Sales Outreach Copilot.", isHeadless);
    await page.goto('/admin/leads');
    await page.waitForTimeout(2000);
    await injectCursor(page);

    await speak(page, "We can click on our captured lead to open the AI sales outreach workspace.", isHeadless);
    
    const leadRow = page.locator('tr:has-text("anthony_demo@gmail.com")').first();
    const fallbackRow = page.locator('tbody tr').first();
    
    if (await leadRow.isVisible({ timeout: 4000 }).catch(() => false)) {
      await clickWithCursor(page, leadRow);
    } else {
      await clickWithCursor(page, fallbackRow);
    }
    await page.waitForTimeout(3000);

    await speak(page, "The AI Copilot has generated a personalized WhatsApp pitch using the customer's solar payback calculation.", isHeadless);
    await page.waitForTimeout(2000);

    await speak(page, "Let's toggle to the Email tab to view the generated email campaign pitch.", isHeadless);
    await clickWithCursor(page, page.getByRole('button', { name: /Email/i }).first());

    await speak(page, "And finally, we view the Call Outreach tab to inspect the interactive cold-call phone script.", isHeadless);
    await clickWithCursor(page, page.getByRole('button', { name: /Call/i }).first());

    await speak(page, "This completes the end-to-end walkthrough of the SolarQuotePro platform. Thank you!", isHeadless);
    await page.waitForTimeout(2000);
  });
});
