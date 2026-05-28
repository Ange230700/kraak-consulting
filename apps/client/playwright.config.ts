import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour les tests E2E du site web KRAAK.
 * Voir https://playwright.dev/docs/test-configuration
 */
const localWebPort = Number(process.env['KRAAK_WEB_PORT'] ?? '4200');
const localWebBaseUrl = `http://localhost:${localWebPort}`;
const configuredBaseUrl = process.env['KRAAK_E2E_BASE_URL']?.trim();
const resolvedBaseUrl =
  configuredBaseUrl && configuredBaseUrl.length > 0
    ? configuredBaseUrl
    : localWebBaseUrl;
const reuseExistingServer = process.env['KRAAK_E2E_REUSE_SERVER'] === 'true';
const shouldUseLocalWebServer = resolvedBaseUrl === localWebBaseUrl;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 1,
  workers: process.env['CI'] ? 1 : 3,
  timeout: 60_000,
  reporter: process.env['CI']
    ? 'github'
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: resolvedBaseUrl,
    navigationTimeout: 60_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: shouldUseLocalWebServer
    ? {
        command: `node ../../scripts/generate-client-runtime-config.mjs --env local && node -e "require('node:fs').rmSync('.angular/cache', { recursive: true, force: true })" && npx ng serve web --port ${localWebPort} --prebundle=false --live-reload=false`,
        url: localWebBaseUrl,
        reuseExistingServer,
        timeout: 180_000,
        env: {
          CLIENT_FEATURE_PARTICIPANT_AREA: 'true',
          CLIENT_API_BASE_URL: localWebBaseUrl,
        },
      }
    : undefined,
});
