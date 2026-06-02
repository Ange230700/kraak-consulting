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
  readEnv('CLIENT_MOBILE_SITE_URL', 'MOBILE_SITE_URL') ||
  'http://localhost:4300';
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
  apiBaseUrl: readEnv('CLIENT_API_BASE_URL') || 'http://localhost:3000',
  pushNotificationsEnabled: true,
  pushNotificationsProvider: 'fcm',
  supabaseUrl: readEnv('SUPABASE_URL') || 'http://127.0.0.1:54321',
  supabasePublishableKey: '',
  ga4Id: '',
};
