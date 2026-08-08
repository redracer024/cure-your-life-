import { defineConfig, devices } from '@playwright/test';

const MOBILE_TEST_PORT = 3003;

export default defineConfig({
  testDir: './tests/mobile',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  expect: { timeout: 5_000 },
  use: {
    baseURL: `http://localhost:${MOBILE_TEST_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: 'Mobile Chrome Large',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: `PORT=${MOBILE_TEST_PORT} npm run dev`,
    url: `http://localhost:${MOBILE_TEST_PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
