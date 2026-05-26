const defaultSiteUrl = 'https://kraak-web-prod.onrender.com';
const runtimeGlobals = globalThis as typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};
const runtimeSiteUrl = runtimeGlobals.process?.env?.['PUBLIC_SITE_URL']
  ? runtimeGlobals.process.env['PUBLIC_SITE_URL']
  : defaultSiteUrl;
const runtimeGa4Id =
  runtimeGlobals.process?.env?.['PUBLIC_GA4_ID']?.trim() ?? '';

export const environment = {
  production: true,
  enableParticipantArea: false,
  siteUrl: runtimeSiteUrl,
  apiBaseUrl: 'https://kraak-api-prod.onrender.com',
  supabaseUrl: 'https://pwuivkqnmjpxxpppmnvu.supabase.co',
  supabasePublishableKey: 'sb_publishable_GucCTbOp6G0qJYbblIXPAQ_HztMaJ-r',
  ga4Id: runtimeGa4Id,
  tfjsBackend: 'wasm' as const,
};
