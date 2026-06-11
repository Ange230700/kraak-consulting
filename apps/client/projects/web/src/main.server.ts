// apps\client\projects\web\src\main.server.ts

import {
  BootstrapContext,
  bootstrapApplication,
} from '@angular/platform-browser';
import { App } from './app/app.component';
import { config } from './app/app.config.server';

// Hydrate the runtime config on the SSR side from process.env when the browser
// asset script has not yet run (the asset only sets globalThis on the client).
// Keeps single source of truth for feature flags between server and browser.
if (
  typeof globalThis !== 'undefined' &&
  !globalThis.__KRAAK_RUNTIME_CONFIG__ &&
  typeof process !== 'undefined' &&
  process.env
) {
  const readOptionalEnv = (keys: readonly string[]): string | undefined => {
    for (const key of keys) {
      const value = process.env[key]?.trim();

      if (value) {
        return value;
      }
    }

    return undefined;
  };

  const flag = process.env['CLIENT_FEATURE_PARTICIPANT_AREA'];

  globalThis.__KRAAK_RUNTIME_CONFIG__ = Object.freeze({
    enableParticipantArea:
      typeof flag === 'string' ? flag.trim() === 'true' : undefined,
    apiBaseUrl: readOptionalEnv(['CLIENT_API_BASE_URL']),
    siteUrl: readOptionalEnv(['CLIENT_SITE_URL']),
    supabaseUrl: readOptionalEnv(['CLIENT_SUPABASE_URL', 'SUPABASE_URL']),
    supabasePublishableKey: readOptionalEnv([
      'CLIENT_SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_PUBLISHABLE_KEY',
    ]),
  });
}

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(App, config, context);

export default bootstrap;
