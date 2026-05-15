import { environment } from '../../../environments/environment';

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
  return (
    getRuntimeConfig().enableParticipantArea ??
    environment.enableParticipantArea
  );
}

function stripTrailingSlashes(value: string): string {
  let endIndex = value.length;

  while (endIndex > 0 && value.codePointAt(endIndex - 1) === 47) {
    endIndex -= 1;
  }

  return value.slice(0, endIndex);
}

export function resolveApiBaseUrl(fallback = ''): string {
  const runtimeApiBaseUrl = getRuntimeConfig().apiBaseUrl?.trim();

  if (runtimeApiBaseUrl) {
    return stripTrailingSlashes(runtimeApiBaseUrl);
  }

  return stripTrailingSlashes(fallback);
}
