interface RuntimeClientConfig {
  readonly apiBaseUrl: string;
  readonly publicAssetBaseUrl: string;
  readonly contactPhoneE164: string;
  readonly contactPhoneDisplay: string;
  readonly contactEmail: string;
  readonly whatsappContactHref: string;
  readonly facebookUrl: string;
  readonly instagramUrl: string;
  readonly tiktokUrl: string;
  readonly siteUrl: string;
  readonly supabaseUrl: string;
  readonly supabasePublishableKey: string;
}

interface RuntimeConfigSource {
  readonly apiBaseUrl?: string;
  readonly publicAssetBaseUrl?: string;
  readonly contactPhoneE164?: string;
  readonly contactPhoneDisplay?: string;
  readonly contactEmail?: string;
  readonly whatsappContactHref?: string;
  readonly facebookUrl?: string;
  readonly instagramUrl?: string;
  readonly tiktokUrl?: string;
  readonly siteUrl?: string;
  readonly supabaseUrl?: string;
  readonly supabasePublishableKey?: string;
}

const runtimeGlobals = globalThis as typeof globalThis & {
  __KRAAK_RUNTIME_CONFIG__?: RuntimeConfigSource;
  process?: {
    env?: Record<string, string | undefined>;
  };
};

function readProcessEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = runtimeGlobals.process?.env?.[key]?.trim();
    if (value) {
      return value;
    }
  }

  return '';
}

export function resolveRuntimeClientConfig(): RuntimeClientConfig {
  const runtimeConfig = runtimeGlobals.__KRAAK_RUNTIME_CONFIG__;

  return {
    apiBaseUrl:
      runtimeConfig?.apiBaseUrl?.trim() ||
      readProcessEnv('CLIENT_API_BASE_URL'),
    publicAssetBaseUrl:
      runtimeConfig?.publicAssetBaseUrl?.trim() ||
      readProcessEnv('KRAAK_PUBLIC_ASSET_BASE_URL'),
    contactPhoneE164:
      runtimeConfig?.contactPhoneE164?.trim() ||
      readProcessEnv('KRAAK_CONTACT_PHONE_E164'),
    contactPhoneDisplay:
      runtimeConfig?.contactPhoneDisplay?.trim() ||
      readProcessEnv('KRAAK_CONTACT_PHONE_DISPLAY'),
    contactEmail:
      runtimeConfig?.contactEmail?.trim() ||
      readProcessEnv('KRAAK_CONTACT_EMAIL'),
    whatsappContactHref:
      runtimeConfig?.whatsappContactHref?.trim() ||
      readProcessEnv('KRAAK_WHATSAPP_CONTACT_HREF'),
    facebookUrl:
      runtimeConfig?.facebookUrl?.trim() ||
      readProcessEnv('KRAAK_FACEBOOK_URL'),
    instagramUrl:
      runtimeConfig?.instagramUrl?.trim() ||
      readProcessEnv('KRAAK_INSTAGRAM_URL'),
    tiktokUrl:
      runtimeConfig?.tiktokUrl?.trim() || readProcessEnv('KRAAK_TIKTOK_URL'),
    siteUrl:
      runtimeConfig?.siteUrl?.trim() ||
      readProcessEnv('PUBLIC_SITE_URL', 'CLIENT_SITE_URL'),
    supabaseUrl:
      runtimeConfig?.supabaseUrl?.trim() || readProcessEnv('SUPABASE_URL'),
    supabasePublishableKey:
      runtimeConfig?.supabasePublishableKey?.trim() ||
      readProcessEnv('SUPABASE_PUBLISHABLE_KEY'),
  };
}
