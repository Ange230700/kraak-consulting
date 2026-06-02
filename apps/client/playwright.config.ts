import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour les tests E2E du site web KRAAK.
 * Voir https://playwright.dev/docs/test-configuration
 */
const requireEnv = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(
      `Variable d'environnement requise pour Playwright web: ${key}`,
    );
  }

  return value;
};
const reuseExistingServer = process.env['KRAAK_E2E_REUSE_SERVER'] === 'true';
const shouldStartWebServer =
  process.env['KRAAK_E2E_START_WEB_SERVER'] === 'true';
const resolvedBaseUrl = requireEnv('KRAAK_E2E_BASE_URL');
const resolvedClientApiBaseUrl = requireEnv('CLIENT_API_BASE_URL');
const resolvedClientSiteUrl = requireEnv('CLIENT_SITE_URL');
const resolvedWebServerUrl = shouldStartWebServer
  ? requireEnv('KRAAK_E2E_WEB_SERVER_URL')
  : '';
const resolvedWebServerCommand = shouldStartWebServer
  ? requireEnv('KRAAK_E2E_WEB_SERVER_COMMAND')
  : '';

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
  webServer: shouldStartWebServer
    ? {
        command: resolvedWebServerCommand,
        url: resolvedWebServerUrl,
        reuseExistingServer,
        timeout: 180_000,
        env: {
          CLIENT_FEATURE_PARTICIPANT_AREA: 'true',
          CLIENT_API_BASE_URL: resolvedClientApiBaseUrl,
          CLIENT_SITE_URL: resolvedClientSiteUrl,
        },
      }
    : undefined,
});
