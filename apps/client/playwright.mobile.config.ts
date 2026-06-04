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
const getEnvOrFallback = (key: string, fallback: string): string => {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : fallback;
};

const shouldStartWebServer =
  process.env['KRAAK_E2E_START_WEB_SERVER'] === 'true' || !process.env['CI'];
const isCi = !!process.env['CI'];
const resolvedBaseUrl = isCi
  ? requireEnv('KRAAK_E2E_BASE_URL')
  : getEnvOrFallback('KRAAK_E2E_BASE_URL', 'http://localhost:4200');
const resolvedClientApiBaseUrl = isCi
  ? requireEnv('CLIENT_API_BASE_URL')
  : getEnvOrFallback('CLIENT_API_BASE_URL', 'http://localhost:3000');
const resolvedClientSiteUrl = isCi
  ? requireEnv('CLIENT_SITE_URL')
  : getEnvOrFallback('CLIENT_SITE_URL', 'http://localhost:4200');
let resolvedWebServerUrl = '';
let resolvedWebServerCommand = '';
const reuseExistingServer = process.env['KRAAK_E2E_REUSE_SERVER'] === 'true';

if (shouldStartWebServer) {
  resolvedWebServerUrl = isCi
    ? requireEnv('KRAAK_E2E_WEB_SERVER_URL')
    : getEnvOrFallback('KRAAK_E2E_WEB_SERVER_URL', 'http://localhost:4200');

  resolvedWebServerCommand = isCi
    ? requireEnv('KRAAK_E2E_WEB_SERVER_COMMAND')
    : getEnvOrFallback(
        'KRAAK_E2E_WEB_SERVER_COMMAND',
        "node ../../scripts/generate-client-runtime-config.mjs --env local && node -e \"require('node:fs').rmSync('.angular/cache', { recursive: true, force: true })\" && npx ng serve web --port 4200 --prebundle=false --live-reload=false",
      );
}

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
