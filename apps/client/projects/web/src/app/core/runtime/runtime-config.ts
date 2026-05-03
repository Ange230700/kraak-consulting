interface KraakRuntimeConfig {
  readonly apiBaseUrl?: string;
  readonly supabaseUrl?: string;
  readonly supabasePublishableKey?: string;
  readonly enableParticipantArea?: boolean;
}

declare global {
  var __KRAAK_RUNTIME_CONFIG__: KraakRuntimeConfig | undefined;
}

export function getRuntimeConfig(): KraakRuntimeConfig {
  return globalThis.__KRAAK_RUNTIME_CONFIG__ ?? {};
}

export function isParticipantAreaEnabled(): boolean {
  return getRuntimeConfig().enableParticipantArea === true;
}
