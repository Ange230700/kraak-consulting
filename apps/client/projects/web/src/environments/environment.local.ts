const defaultSiteUrl = 'http://localhost:4200';
const runtimeOrigin =
  typeof globalThis !== 'undefined' &&
  'location' in globalThis &&
  globalThis.location?.origin
    ? globalThis.location.origin
    : defaultSiteUrl;

export const environment = {
  environmentName: 'local',
  production: false,
  siteUrl: runtimeOrigin,
  apiBaseUrl: 'http://localhost:3000',
  supabaseUrl: 'http://127.0.0.1:54321',
  supabasePublishableKey: '',
  ga4Id: '',
  tfjsBackend: 'wasm' as const,
};
