import { test, expect } from '@playwright/test';

test.describe('Solar Sizing Wizard and Quotas', () => {
  // Use the pre-authenticated installer state
  test.use({ storageState: 'tests/e2e/.auth/installer.json' });

  test('Successful 5-Step Solar Sizing Wizard and Print Preview Generation', async ({ page }) => {
    test.setTimeout(120000);
    // Listen to browser console and error logs
    page.on('console', msg => console.log(`[BROWSER]: ${msg.type().toUpperCase()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[BROWSER-ERROR]: ${err.message}\n${err.stack}`));

    // 1. Inject Enterprise subscription tier & seed FX rate cache to prevent external API calls
    await page.addInitScript(() => {
      localStorage.removeItem('solar-wizard-store');
      localStorage.setItem('solarquotepro_last_fx_rate', '1600');
      localStorage.setItem('solarquotepro_fx_rate_timestamp', Date.now().toString());

      localStorage.setItem('solarquotepro-subscription-store', JSON.stringify({
        state: {
          tier: 'enterprise',
          billingCycle: 'monthly',
          isTrial: false,
          trialStartDate: Date.now(),
          trialProposalsRemaining: 0
        }
      }));
    });
await page.route('**/api/admin/fx-rates', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { customRate: 1600 } })
  });
});
await page.route('**/open.er-api.com/**', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ rates: { NGN: 1600 } })
  });
});

    // 2. Navigate to the wizard
    await page.goto('/proposals/new?type=wizard');
    await expect(page).toHaveURL(/\/proposals\/new\?type=wizard/);

    // --- STEP 1: Appliances & Load Profiling ---
    await expect(page.locator('input[placeholder="Search appliances…"]')).toBeVisible();

    // Click quick-add buttons to add appliances
    const tvButton = page.getByRole('button', { name: '📺 LED TV' });
    const fridgeButton = page.getByRole('button', { name: '🥶 Fridge/Freezer' });

    // Wait for client-side hydration to complete
    await expect(page.locator('text=Rate: ₦')).toBeVisible({ timeout: 20000 });

    await tvButton.click();
    await fridgeButton.click();

    // Verify live calculations summary updates in the right sidebar
    await expect(page.locator('text=Live Load Summary')).toBeVisible();
    
    // We expect the daily load to update to a non-zero value
    const totalDailyWhText = page.locator('div:has-text("Total Daily Load") >> p').last();
    await expect(totalDailyWhText).toBeVisible();
    const dailyLoadVal = await totalDailyWhText.innerText();
    expect(dailyLoadVal).not.toBe('0.0 kWh');

    // Click Next to proceed to Step 2
    await page.getByRole('button', { name: /Next: System Preferences/i }).click();

    // --- STEP 2: Preferences & Tariffs ---
    await expect(page.locator('text=A. Battery Chemistry')).toBeVisible();

    // Fill energy spend parameters
    await page.locator('#petrol-price').fill('1500');
    await page.locator('#diesel-price').fill('1800');
    await page.locator('#monthly-phcn').fill('20000');
    await page.locator('#monthly-gen-fuel').fill('100000');
    await page.locator('#monthly-gen-maint').fill('15000');

    // Total monthly legacy spend is: 20k + 100k + 15k = 135k NGN
    await expect(page.locator('text=₦135,000 / month')).toBeVisible();

    // Proceed to Step 3
    await page.getByRole('button', { name: /Next: Hardware Selection/i }).click();

    // --- STEP 3: Hardware Selection ---
    await expect(page.locator('text=Step 3: Hardware Selection')).toBeVisible();

    // Select the Economy package
    await page.getByRole('button', { name: 'Select Economy' }).click();

    // Proceed to Step 4
    await page.getByRole('button', { name: 'Continue to ROI' }).click();

    // --- STEP 4: ROI & Margins ---
    await expect(page.locator('text=🚀 Quick Sizing Pricing (Simple)')).toBeVisible();

    // Customize pricing variables
    await page.locator('input[placeholder="80\\,000"]').fill('90000'); // Installation/Labour
    await page.locator('input[placeholder="25\\,000"]').fill('30000'); // Logistics/Transport
    await page.locator('input[placeholder="15"]').fill('20'); // Markup margin percent

    // Check simple VAT option to add VAT
    const vatCheckbox = page.locator('#simple_vat');
    await vatCheckbox.check();
    await expect(vatCheckbox).toBeChecked();

    // Save and Update Pricing to proceed to Step 5
    await page.getByRole('button', { name: 'Save & Update Pricing' }).click();

    // --- STEP 5: Finalize & Save ---
    await expect(page.getByRole('heading', { name: 'Customer Details' })).toBeVisible();

    // Fill customer info
    await page.locator('input[placeholder="e.g. John Doe"]').fill('SolarQuotePro E2E Test Client');
    await page.locator('input[placeholder="john@example.com"]').fill('client@test.local');

    // Expand Installer Branding panel
    const brandingHeader = page.getByRole('button', { name: /Installer Branding/i });
    await brandingHeader.click();

    // Slogan / Slogan input field should become visible
    const taglineInput = page.locator('input[placeholder="e.g. Powering Nigeria\'s Future"]');
    await expect(taglineInput).toBeVisible();
    await taglineInput.fill('E2E Custom Tagline');

    // Click Generate PDF Proposal to navigate to print page
    await page.getByRole('button', { name: 'Generate PDF Proposal' }).click({ timeout: 45000 });

    // --- PRINT PREVIEW VERIFICATION ---
    await expect(page).toHaveURL(/\/proposals\/print/, { timeout: 35000 });

    // Verify key proposal info is visible on the print page
    await expect(page.locator('text=SolarQuotePro E2E Test Client')).toBeVisible();
    await expect(page.locator('text=E2E Custom Tagline')).toBeVisible();

    // Verify Bill of Materials table is rendered
    await expect(page.locator('table').first()).toBeVisible();
    await expect(page.locator('text=Inverter').first()).toBeVisible();
  });

  test('Free subscription tier limits user to exactly 3 proposals', async ({ page }) => {
    test.setTimeout(120000);
    // Listen to browser console and error logs
    page.on('console', msg => console.log(`[BROWSER-FREE]: ${msg.type().toUpperCase()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[BROWSER-FREE-ERROR]: ${err.message}\n${err.stack}`));

    // 1. Inject Free subscription tier, 3 pre-existing saved proposals, and seed FX rate cache
    await page.addInitScript(() => {
      localStorage.removeItem('solar-wizard-store');
      localStorage.setItem('solarquotepro_last_fx_rate', '1600');
      localStorage.setItem('solarquotepro_fx_rate_timestamp', Date.now().toString());

      localStorage.setItem('solarquotepro-subscription-store', JSON.stringify({
        state: {
          tier: 'free',
          billingCycle: 'monthly',
          isTrial: false,
          trialStartDate: Date.now(),
          trialProposalsRemaining: 0
        }
      }));

      localStorage.setItem('solar-history-store', JSON.stringify({
        state: {
          savedProposals: [
            {
              id: 'existing-proposal-id-1',
              client_token: 'existing-client-token-1',
              createdAt: Date.now() - 3600000 * 3,
              updatedAt: Date.now() - 3600000 * 3,
              flowType: 'wizard',
              step: 5,
              proposal: {
                customer_name: 'First Free Client',
                customer_email: 'first@free.local',
                backup_hours: 8,
                peak_sun_hours: 4.2,
                battery_chemistry: 'lithium',
                selected_tier: 'standard',
                appliances: []
              }
            },
            {
              id: 'existing-proposal-id-2',
              client_token: 'existing-client-token-2',
              createdAt: Date.now() - 3600000 * 2,
              updatedAt: Date.now() - 3600000 * 2,
              flowType: 'wizard',
              step: 5,
              proposal: {
                customer_name: 'Second Free Client',
                customer_email: 'second@free.local',
                backup_hours: 8,
                peak_sun_hours: 4.2,
                battery_chemistry: 'lithium',
                selected_tier: 'standard',
                appliances: []
              }
            },
            {
              id: 'existing-proposal-id-3',
              client_token: 'existing-client-token-3',
              createdAt: Date.now() - 3600000,
              updatedAt: Date.now() - 3600000,
              flowType: 'wizard',
              step: 5,
              proposal: {
                customer_name: 'Third Free Client',
                customer_email: 'third@free.local',
                backup_hours: 8,
                peak_sun_hours: 4.2,
                battery_chemistry: 'lithium',
                selected_tier: 'standard',
                appliances: []
              }
            }
          ]
        }
      }));
    });
await page.route('**/api/admin/fx-rates', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { customRate: 1600 } })
  });
});
await page.route('**/open.er-api.com/**', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ rates: { NGN: 1600 } })
  });
});

    // 2. Go to the new proposal page (wizard)
    await page.goto('/proposals/new?type=wizard');

    // Wait for client-side hydration to complete
    await expect(page.locator('text=Rate: ₦')).toBeVisible({ timeout: 20000 });

    // Make minimal inputs to proceed to Step 5
    await page.getByRole('button', { name: '📺 LED TV' }).click();
    await page.getByRole('button', { name: /Next: System Preferences/i }).click();
    await page.getByRole('button', { name: /Next: Hardware Selection/i }).click();
    await page.getByRole('button', { name: 'Select Economy' }).click();
    await page.getByRole('button', { name: 'Continue to ROI' }).click();
    await page.getByRole('button', { name: 'Save & Update Pricing' }).click();

    // Enter name for the second proposal
    await page.locator('input[placeholder="e.g. John Doe"]').fill('Second Client Trial');

    // Click "Share via WhatsApp" which triggers saveProposal check
    await page.getByRole('button', { name: 'Copy Web Link' }).click();

    // Verify limit warning or upgrade modal is shown
    await expect(page.locator('text=Proposal limit reached')).toBeVisible();
    await expect(page.locator('text=Please upgrade to save new estimates')).toBeVisible();
  });
});
