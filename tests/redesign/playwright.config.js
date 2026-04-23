// Playwright config for marketing redesign verification
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: __dirname,
  timeout: 30000,
  fullyParallel: true,
  workers: 4,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8123',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 900 },
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
