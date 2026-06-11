// apps\client\projects\web\src\environments\environment.local.ts

const runtimeGlobals = globalThis as typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

function readEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = runtimeGlobals.process?.env?.[key]?.trim();
    if (value) {
      return value;
    }
  }

  return '';
}

const defaultSiteUrl =
  readEnv('CLIENT_SITE_URL', 'PUBLIC_SITE_URL') || 'http://localhost:4200';
const runtimeOrigin =
  typeof globalThis !== 'undefined' &&
  'location' in globalThis &&
  globalThis.location?.origin
    ? globalThis.location.origin
    : defaultSiteUrl;

export const environment = {
  production: false,
  enableParticipantArea: true,
  siteUrl: runtimeOrigin,
  apiBaseUrl: readEnv('CLIENT_API_BASE_URL') || 'http://localhost:3000',
  supabaseUrl: readEnv('CLIENT_SUPABASE_URL') || 'http://127.0.0.1:54321',
  supabasePublishableKey: readEnv('CLIENT_SUPABASE_PUBLISHABLE_KEY') || '',
  ga4Id: '',
  tfjsBackend: 'wasm' as const,
};
