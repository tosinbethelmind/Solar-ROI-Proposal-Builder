import { test, expect } from '@playwright/test';

test.describe('Scaling & API Integrations Configuration', () => {
  // Use the already authenticated installer storage state
  test.use({ storageState: 'tests/e2e/.auth/installer.json' });

  test('should allow configuring free tier API integrations, toggling visibility, and persisting values', async ({ page }) => {
    // 1. Navigate to settings page
    page.on('console', msg => console.log(`[Browser Console] [${msg.type()}] ${msg.text()}`));
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);

    // 2. Scroll to the "Scaling & API Integrations" card
    const scalingCardHeader = page.locator('span:has-text("Scaling & API Integrations")');
    await expect(scalingCardHeader).toBeVisible();

    // 3. Fill in Resend Email Delivery Fields
    const resendApiKeyInput = page.locator('#resendApiKey');
    const resendFromEmailInput = page.locator('#resendFromEmail');
    await resendApiKeyInput.fill('re_test_key_123456');
    await resendFromEmailInput.fill('proposals@mytestsolar.com');

    // 4. Fill in Cloudflare R2 Storage Fields
    const r2BucketInput = page.locator('#cloudflareR2BucketName');
    const r2AccountIdInput = page.locator('#cloudflareR2AccountId');
    const r2AccessKeyInput = page.locator('#cloudflareR2AccessKey');
    const r2SecretKeyInput = page.locator('#cloudflareR2SecretKey');
    await r2BucketInput.fill('solar-proposals-bucket');
    await r2AccountIdInput.fill('cf-acct-id-998877');
    await r2AccessKeyInput.fill('cf-access-key-xyz');
    await r2SecretKeyInput.fill('cf-secret-key-abc');

    // 5. Fill in Inngest Fields
    const inngestKeyInput = page.locator('#inngestEventKey');
    await inngestKeyInput.fill('signkey_inngest_test_77');

    // 6. Fill in Upstash Redis Fields
    const redisUrlInput = page.locator('#upstashRedisRestUrl');
    const redisTokenInput = page.locator('#upstashRedisRestToken');
    await redisUrlInput.fill('https://solar-redis.upstash.io');
    await redisTokenInput.fill('upstash-redis-token-123');

    // 7. Verify Password/Key Visibility Toggles
    // Initially, they should be of type "password"
    await expect(resendApiKeyInput).toHaveAttribute('type', 'password');
    await expect(r2SecretKeyInput).toHaveAttribute('type', 'password');
    await expect(inngestKeyInput).toHaveAttribute('type', 'password');
    await expect(redisTokenInput).toHaveAttribute('type', 'password');

    // Toggle Resend key visibility
    const resendToggleBtn = page.locator('button:has(svg)').nth(1); // First is drag/drop or other toggles, we can use right-hand button within resend api key parent
    const resendApiKeyParent = resendApiKeyInput.locator('..');
    const resendToggle = resendApiKeyParent.locator('button');
    await resendToggle.click();
    await expect(resendApiKeyInput).toHaveAttribute('type', 'text');

    // Toggle R2 secret key visibility
    const r2SecretKeyParent = r2SecretKeyInput.locator('..');
    const r2Toggle = r2SecretKeyParent.locator('button');
    await r2Toggle.click();
    await expect(r2SecretKeyInput).toHaveAttribute('type', 'text');

    // Fill in required company details if they are empty (since mock environment might start empty)
    const companyNameInput = page.locator('#companyName');
    const phoneInput = page.locator('#phone');
    if ((await companyNameInput.inputValue()) === '') {
      await companyNameInput.fill('Mock Solar Solutions');
    }
    if ((await phoneInput.inputValue()) === '') {
      await phoneInput.fill('+234 803 123 4567');
    }

    // 8. Click Save Settings
    // Find form save button
    const saveBtn = page.getByRole('button', { name: /Save Settings/i });
    await saveBtn.click();

    // 9. Verify redirection and localStorage storage update
    await expect(page).toHaveURL(/\/workspace/);

    // Evaluate localStorage state
    const storageValue = await page.evaluate(() => localStorage.getItem('scalingIntegrations'));
    expect(storageValue).not.toBeNull();
    const config = JSON.parse(storageValue || '{}');
    expect(config.resendApiKey).toBe('re_test_key_123456');
    expect(config.resendFromEmail).toBe('proposals@mytestsolar.com');
    expect(config.cloudflareR2BucketName).toBe('solar-proposals-bucket');
    expect(config.cloudflareR2AccountId).toBe('cf-acct-id-998877');
    expect(config.cloudflareR2AccessKey).toBe('cf-access-key-xyz');
    expect(config.cloudflareR2SecretKey).toBe('cf-secret-key-abc');
    expect(config.inngestEventKey).toBe('signkey_inngest_test_77');
    expect(config.upstashRedisRestUrl).toBe('https://solar-redis.upstash.io');
    expect(config.upstashRedisRestToken).toBe('upstash-redis-token-123');

    // 10. Re-navigate to settings and confirm the values load correctly
    await page.goto('/settings');
    await expect(resendApiKeyInput).toHaveValue('re_test_key_123456');
    await expect(resendFromEmailInput).toHaveValue('proposals@mytestsolar.com');
    await expect(r2BucketInput).toHaveValue('solar-proposals-bucket');
    await expect(r2AccountIdInput).toHaveValue('cf-acct-id-998877');
    await expect(r2AccessKeyInput).toHaveValue('cf-access-key-xyz');
    await expect(r2SecretKeyInput).toHaveValue('cf-secret-key-abc');
    await expect(inngestKeyInput).toHaveValue('signkey_inngest_test_77');
    await expect(redisUrlInput).toHaveValue('https://solar-redis.upstash.io');
    await expect(redisTokenInput).toHaveValue('upstash-redis-token-123');
  });
});
