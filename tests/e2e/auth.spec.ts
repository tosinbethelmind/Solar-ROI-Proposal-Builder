import { test, expect, Page } from '@playwright/test';

// Path to a pre‑authenticated storage state (if needed for other tests)
const installerState = 'tests/e2e/.auth/installer.json';

/**
 * Helper to attempt a login with given credentials and capture the error message.
 */
async function attemptLogin(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForSelector('#email');
  await page.fill('#email', email);
  await page.waitForSelector('#password');
  await page.fill('#password', password);
  // Click sign‑in and wait for either navigation or error toast
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
    page.click('button:has-text("Sign In")')
  ]);
  await page.waitForTimeout(500);
  return page.locator('text=Invalid email or password');
}

/**
 * 1️⃣ Invalid credentials test – ensures the UI shows a proper error.
 */
test('login fails with wrong credentials', async ({ page }) => {
  const error = await attemptLogin(page, 'nonexistent@example.com', 'wrongpassword');
  await expect(error).toBeVisible();
});

/**
 * 2️⃣ Expired session test – clears the auth cookie/storage and expects a redirect to login.
 */
test.use({ storageState: installerState });

test('session expiry redirects to login', async ({ page, context }) => {
  // Simulate session expiration by clearing cookies & localStorage
await context.clearCookies();
await page.evaluate(() => {
  try {
    localStorage.clear();
  } catch (e) {
    // ignore errors when localStorage is not accessible
  }
});
  // Try to access a protected route
  await page.goto('/workspace'); // installer workspace is protected
  // Expect redirection to login page (or a login component visible)
  await expect(page).toHaveURL(/.*\/login/);
  await expect(page.locator('text=Installer Sign In')).toBeVisible();
});

/**
 * 3️⃣ Protected route without auth – no storage state, expect redirect.
 */
test('protected route blocks unauthenticated users', async ({ page }) => {
  await page.goto('/admin'); // admin area is protected
  await expect(page).toHaveURL(/.*\/login/);
  await expect(page.locator('text=Installer Sign In')).toBeVisible();
});
