const defaultSiteUrl = 'https://kraak-consulting.vercel.app';
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
  environmentName: 'production',
  production: true,
  siteUrl: runtimeSiteUrl,
  apiBaseUrl: '',
  supabaseUrl: '',
  supabasePublishableKey: '',
  ga4Id: runtimeGa4Id,
};
