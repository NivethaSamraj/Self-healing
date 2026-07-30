import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,          // a11y scans are heavy; keep them serial for stable results
  retries: 0,                    // never retry an a11y scan — a "flaky pass" hides real violations
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.TALBOTS_BASE_URL ?? 'https://staging.talbots.com',
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    // { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },  // enable for mobile-only issues (target-size, reflow)
  ],
});
