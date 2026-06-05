import { resolveRuntimeClientConfig } from '../../../shared/runtime-client-config';

const runtimeGlobals = globalThis as typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

const runtimeClientConfig = resolveRuntimeClientConfig();
const runtimeGa4Id =
  runtimeGlobals.process?.env?.['PUBLIC_GA4_ID']?.trim() ?? '';

export const environment = {
  production: true,
  enableParticipantArea: true,
  siteUrl: runtimeClientConfig.siteUrl,
  apiBaseUrl: runtimeClientConfig.apiBaseUrl,
  supabaseUrl: runtimeClientConfig.supabaseUrl,
  supabasePublishableKey: runtimeClientConfig.supabasePublishableKey,
  ga4Id: runtimeGa4Id,
  tfjsBackend: 'wasm' as const,
};
