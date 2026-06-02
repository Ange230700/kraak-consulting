const runtimeGlobals = globalThis as typeof globalThis & {
  __KRAAK_RUNTIME_CONFIG__?: {
    apiBaseUrl?: string;
    siteUrl?: string;
    supabaseUrl?: string;
    supabasePublishableKey?: string;
  };
  process?: {
    env?: Record<string, string | undefined>;
  };
};
const runtimeConfig = runtimeGlobals.__KRAAK_RUNTIME_CONFIG__;
const runtimeSiteUrl =
  runtimeConfig?.siteUrl?.trim() ??
  runtimeGlobals.process?.env?.['CLIENT_SITE_URL']?.trim() ??
  '';
const runtimeApiBaseUrl =
  runtimeConfig?.apiBaseUrl?.trim() ??
  runtimeGlobals.process?.env?.['CLIENT_API_BASE_URL']?.trim() ??
  '';
const runtimeSupabaseUrl =
  runtimeConfig?.supabaseUrl?.trim() ??
  runtimeGlobals.process?.env?.['SUPABASE_URL']?.trim() ??
  '';
const runtimeSupabasePublishableKey =
  runtimeConfig?.supabasePublishableKey?.trim() ??
  runtimeGlobals.process?.env?.['SUPABASE_PUBLISHABLE_KEY']?.trim() ??
  '';

export const environment = {
  environmentName: 'staging',
  production: true,
  siteUrl: runtimeSiteUrl,
  apiBaseUrl: runtimeApiBaseUrl,
  pushNotificationsEnabled: true,
  pushNotificationsProvider: 'fcm',
  supabaseUrl: runtimeSupabaseUrl,
  supabasePublishableKey: runtimeSupabasePublishableKey,
  ga4Id: '',
};
