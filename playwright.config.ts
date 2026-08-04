import { defineConfig, devices } from '@playwright/test';

// Fixed port for the test-dedicated dev server. Kept separate from the manual
// servers commonly left running on 3000 (main repo) and 3001 (staging).
const TEST_PORT = 3002;

export default defineConfig({
  testDir: './tests/assessment',
  // Each spec clones its own isolated browser context, so specs are safe to
  // run in parallel. CI pins to a single worker for stability.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list']],

  expect: { timeout: 5_000 },

  use: {
    baseURL: `http://localhost:${TEST_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 7'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],

  webServer: {
    command: `PORT=${TEST_PORT} npm run dev`,
    url: `http://localhost:${TEST_PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
