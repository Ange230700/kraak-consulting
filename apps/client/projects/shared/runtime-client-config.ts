interface RuntimeClientConfig {
  readonly apiBaseUrl: string;
  readonly siteUrl: string;
  readonly supabaseUrl: string;
  readonly supabasePublishableKey: string;
}

interface RuntimeConfigSource {
  readonly apiBaseUrl?: string;
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
