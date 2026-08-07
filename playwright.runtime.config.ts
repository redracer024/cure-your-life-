import { defineConfig, devices } from '@playwright/test';

const TEST_PORT = 3002;

export default defineConfig({
  testDir: './tests/runtime',
  fullyParallel: false,
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
  ],
  webServer: {
    command: 'PORT=3002 node dist/server.cjs',
    url: `http://localhost:${TEST_PORT}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
