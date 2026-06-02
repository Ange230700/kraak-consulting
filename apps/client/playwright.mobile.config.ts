import { defineConfig, devices } from '@playwright/test';

const requireEnv = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(
      `Variable d'environnement requise pour Playwright mobile: ${key}`,
    );
  }

  return value;
};

const resolvedBaseUrl = requireEnv('KRAAK_E2E_BASE_URL');
const shouldStartWebServer =
  process.env['KRAAK_E2E_START_WEB_SERVER'] === 'true';
const resolvedWebServerUrl = shouldStartWebServer
  ? requireEnv('KRAAK_E2E_WEB_SERVER_URL')
  : '';
const resolvedWebServerCommand = shouldStartWebServer
  ? requireEnv('KRAAK_E2E_WEB_SERVER_COMMAND')
  : '';
const resolvedClientApiBaseUrl = requireEnv('CLIENT_API_BASE_URL');
const resolvedClientSiteUrl = requireEnv('CLIENT_SITE_URL');
const reuseExistingServer = process.env['KRAAK_E2E_REUSE_SERVER'] === 'true';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 1,
  workers: 1,
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
      name: 'chrome-android',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'safari-iphone',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: shouldStartWebServer
    ? {
        command: resolvedWebServerCommand,
        url: resolvedWebServerUrl,
        reuseExistingServer,
        timeout: 120_000,
        env: {
          CLIENT_FEATURE_PARTICIPANT_AREA: 'true',
          CLIENT_API_BASE_URL: resolvedClientApiBaseUrl,
          CLIENT_SITE_URL: resolvedClientSiteUrl,
        },
      }
    : undefined,
});
