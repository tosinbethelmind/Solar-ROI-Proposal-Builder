# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wizard.spec.ts >> Solar Sizing Wizard and Quotas >> Successful 5-Step Solar Sizing Wizard and Print Preview Generation
- Location: tests\e2e\wizard.spec.ts:7:7

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: page.goto: Test timeout of 120000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/proposals/new?type=wizard", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Solar Sizing Wizard and Quotas', () => {
  4   |   // Use the pre-authenticated installer state
  5   |   test.use({ storageState: 'tests/e2e/.auth/installer.json' });
  6   | 
  7   |   test('Successful 5-Step Solar Sizing Wizard and Print Preview Generation', async ({ page }) => {
  8   |     test.setTimeout(120000);
  9   |     // Listen to browser console and error logs
  10  |     page.on('console', msg => console.log(`[BROWSER]: ${msg.type().toUpperCase()}: ${msg.text()}`));
  11  |     page.on('pageerror', err => console.error(`[BROWSER-ERROR]: ${err.message}\n${err.stack}`));
  12  | 
  13  |     // 1. Inject Enterprise subscription tier & seed FX rate cache to prevent external API calls
  14  |     await page.addInitScript(() => {
  15  |       localStorage.removeItem('solar-wizard-store');
  16  |       localStorage.setItem('solarquotepro_last_fx_rate', '1600');
  17  |       localStorage.setItem('solarquotepro_fx_rate_timestamp', Date.now().toString());
  18  | 
  19  |       localStorage.setItem('solarquotepro-subscription-store', JSON.stringify({
  20  |         state: {
  21  |           tier: 'enterprise',
  22  |           billingCycle: 'monthly',
  23  |           isTrial: false,
  24  |           trialStartDate: Date.now(),
  25  |           trialProposalsRemaining: 0
  26  |         }
  27  |       }));
  28  |     });
  29  | await page.route('**/api/admin/fx-rates', route => {
  30  |   route.fulfill({
  31  |     status: 200,
  32  |     contentType: 'application/json',
  33  |     body: JSON.stringify({ data: { customRate: 1600 } })
  34  |   });
  35  | });
  36  | await page.route('**/open.er-api.com/**', route => {
  37  |   route.fulfill({
  38  |     status: 200,
  39  |     contentType: 'application/json',
  40  |     body: JSON.stringify({ rates: { NGN: 1600 } })
  41  |   });
  42  | });
  43  | 
  44  |     // 2. Navigate to the wizard
> 45  |     await page.goto('/proposals/new?type=wizard');
      |                ^ Error: page.goto: Test timeout of 120000ms exceeded.
  46  |     await expect(page).toHaveURL(/\/proposals\/new\?type=wizard/);
  47  | 
  48  |     // --- STEP 1: Appliances & Load Profiling ---
  49  |     await expect(page.locator('input[placeholder="Search appliances…"]')).toBeVisible();
  50  | 
  51  |     // Click quick-add buttons to add appliances
  52  |     const tvButton = page.getByRole('button', { name: '📺 LED TV' });
  53  |     const fridgeButton = page.getByRole('button', { name: '🥶 Fridge/Freezer' });
  54  | 
  55  |     // Wait for client-side hydration to complete
  56  |     await expect(page.locator('text=Rate: ₦')).toBeVisible({ timeout: 20000 });
  57  | 
  58  |     await tvButton.click();
  59  |     await fridgeButton.click();
  60  | 
  61  |     // Verify live calculations summary updates in the right sidebar
  62  |     await expect(page.locator('text=Live Load Summary')).toBeVisible();
  63  |     
  64  |     // We expect the daily load to update to a non-zero value
  65  |     const totalDailyWhText = page.locator('div:has-text("Total Daily Load") >> p').last();
  66  |     await expect(totalDailyWhText).toBeVisible();
  67  |     const dailyLoadVal = await totalDailyWhText.innerText();
  68  |     expect(dailyLoadVal).not.toBe('0.0 kWh');
  69  | 
  70  |     // Click Next to proceed to Step 2
  71  |     await page.getByRole('button', { name: /Next: System Preferences/i }).click();
  72  | 
  73  |     // --- STEP 2: Preferences & Tariffs ---
  74  |     await expect(page.locator('text=A. Battery Chemistry')).toBeVisible();
  75  | 
  76  |     // Fill energy spend parameters
  77  |     await page.locator('#petrol-price').fill('1500');
  78  |     await page.locator('#diesel-price').fill('1800');
  79  |     await page.locator('#monthly-phcn').fill('20000');
  80  |     await page.locator('#monthly-gen-fuel').fill('100000');
  81  |     await page.locator('#monthly-gen-maint').fill('15000');
  82  | 
  83  |     // Total monthly legacy spend is: 20k + 100k + 15k = 135k NGN
  84  |     await expect(page.locator('text=₦135,000 / month')).toBeVisible();
  85  | 
  86  |     // Proceed to Step 3
  87  |     await page.getByRole('button', { name: /Next: Hardware Selection/i }).click();
  88  | 
  89  |     // --- STEP 3: Hardware Selection ---
  90  |     await expect(page.locator('text=Step 3: Hardware Selection')).toBeVisible();
  91  | 
  92  |     // Select the Economy package
  93  |     await page.getByRole('button', { name: 'Select Economy' }).click();
  94  | 
  95  |     // Proceed to Step 4
  96  |     await page.getByRole('button', { name: 'Continue to ROI' }).click();
  97  | 
  98  |     // --- STEP 4: ROI & Margins ---
  99  |     await expect(page.locator('text=🚀 Quick Sizing Pricing (Simple)')).toBeVisible();
  100 | 
  101 |     // Customize pricing variables
  102 |     await page.locator('input[placeholder="80\\,000"]').fill('90000'); // Installation/Labour
  103 |     await page.locator('input[placeholder="25\\,000"]').fill('30000'); // Logistics/Transport
  104 |     await page.locator('input[placeholder="15"]').fill('20'); // Markup margin percent
  105 | 
  106 |     // Check simple VAT option to add VAT
  107 |     const vatCheckbox = page.locator('#simple_vat');
  108 |     await vatCheckbox.check();
  109 |     await expect(vatCheckbox).toBeChecked();
  110 | 
  111 |     // Save and Update Pricing to proceed to Step 5
  112 |     await page.getByRole('button', { name: 'Save & Update Pricing' }).click();
  113 | 
  114 |     // --- STEP 5: Finalize & Save ---
  115 |     await expect(page.getByRole('heading', { name: 'Customer Details' })).toBeVisible();
  116 | 
  117 |     // Fill customer info
  118 |     await page.locator('input[placeholder="e.g. John Doe"]').fill('SolarQuotePro E2E Test Client');
  119 |     await page.locator('input[placeholder="john@example.com"]').fill('client@test.local');
  120 | 
  121 |     // Expand Installer Branding panel
  122 |     const brandingHeader = page.getByRole('button', { name: /Installer Branding/i });
  123 |     await brandingHeader.click();
  124 | 
  125 |     // Slogan / Slogan input field should become visible
  126 |     const taglineInput = page.locator('input[placeholder="e.g. Powering Nigeria\'s Future"]');
  127 |     await expect(taglineInput).toBeVisible();
  128 |     await taglineInput.fill('E2E Custom Tagline');
  129 | 
  130 |     // Click Generate PDF Proposal to navigate to print page
  131 |     await page.getByRole('button', { name: 'Generate PDF Proposal' }).click({ timeout: 45000 });
  132 | 
  133 |     // --- PRINT PREVIEW VERIFICATION ---
  134 |     await expect(page).toHaveURL(/\/proposals\/print/, { timeout: 35000 });
  135 | 
  136 |     // Verify key proposal info is visible on the print page
  137 |     await expect(page.locator('text=SolarQuotePro E2E Test Client')).toBeVisible();
  138 |     await expect(page.locator('text=E2E Custom Tagline')).toBeVisible();
  139 | 
  140 |     // Verify Bill of Materials table is rendered
  141 |     await expect(page.locator('table').first()).toBeVisible();
  142 |     await expect(page.locator('text=Inverter').first()).toBeVisible();
  143 |   });
  144 | 
  145 |   test('Free subscription tier limits user to exactly 1 proposal', async ({ page }) => {
```