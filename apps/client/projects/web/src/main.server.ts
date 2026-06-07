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
  const flag = process.env['CLIENT_FEATURE_PARTICIPANT_AREA'];
  globalThis.__KRAAK_RUNTIME_CONFIG__ = Object.freeze({
    enableParticipantArea:
      typeof flag === 'string' ? flag.trim() === 'true' : undefined,
  });
}

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(App, config, context);

export default bootstrap;
