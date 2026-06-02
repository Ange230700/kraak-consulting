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
  runtimeGlobals.process?.env?.['PUBLIC_SITE_URL']?.trim() ??
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
const runtimeGa4Id =
  runtimeGlobals.process?.env?.['PUBLIC_GA4_ID']?.trim() ?? '';

export const environment = {
  production: true,
  enableParticipantArea: false,
  siteUrl: runtimeSiteUrl,
  apiBaseUrl: runtimeApiBaseUrl,
  supabaseUrl: runtimeSupabaseUrl,
  supabasePublishableKey: runtimeSupabasePublishableKey,
  ga4Id: runtimeGa4Id,
  tfjsBackend: 'wasm' as const,
};
