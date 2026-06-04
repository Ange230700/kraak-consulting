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
const getEnvOrFallback = (key: string, fallback: string): string => {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : fallback;
};
const reuseExistingServer = process.env['KRAAK_E2E_REUSE_SERVER'] === 'true';
const shouldStartWebServer =
  process.env['KRAAK_E2E_START_WEB_SERVER'] === 'true' || !process.env['CI'];
const isCi = !!process.env['CI'];
const resolvedBaseUrl = process.env['CI']
  ? requireEnv('KRAAK_E2E_BASE_URL')
  : getEnvOrFallback('KRAAK_E2E_BASE_URL', 'http://localhost:4200');
const resolvedClientApiBaseUrl = process.env['CI']
  ? requireEnv('CLIENT_API_BASE_URL')
  : getEnvOrFallback('CLIENT_API_BASE_URL', 'http://localhost:3000');
const resolvedClientSiteUrl = process.env['CI']
  ? requireEnv('CLIENT_SITE_URL')
  : getEnvOrFallback('CLIENT_SITE_URL', 'http://localhost:4200');
let resolvedWebServerUrl = '';
let resolvedWebServerCommand = '';

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
