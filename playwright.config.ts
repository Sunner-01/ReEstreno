import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
config({ quiet: true });
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4310',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run dev -w backend',
      url: 'http://127.0.0.1:4311/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    {
      command: 'npm run dev -w frontend',
      url: 'http://127.0.0.1:4310',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
