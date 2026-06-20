import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run sequentially to prevent SQLite/Supabase conflicts on parallel requests
  reporter: 'html',

  globalSetup: require.resolve('./tests/e2e/global-setup'),

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'public',
      testMatch: /.*public\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome']
      }
    },
    {
      name: 'installer',
      testMatch: /.*(workspace|wizard)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, 'tests/e2e/.auth/installer.json')
      }
    },
    {
      name: 'admin',
      testMatch: /.*admin\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, 'tests/e2e/.auth/admin.json')
      }
    }
  ],

  /*
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 180 * 1000 // 180s to allow webpack compilation on slow machines
  }
  */
});
