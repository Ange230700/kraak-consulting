import { resolveRuntimeClientConfig } from '../../../shared/runtime-client-config';

const runtimeClientConfig = resolveRuntimeClientConfig();
const runtimeGa4Id = process?.env?.['PUBLIC_GA4_ID']?.trim() ?? '';

export const environment = {
  production: true,
  enableParticipantArea: false,
  siteUrl: runtimeClientConfig.siteUrl,
  apiBaseUrl: runtimeClientConfig.apiBaseUrl,
  supabaseUrl: runtimeClientConfig.supabaseUrl,
  supabasePublishableKey: runtimeClientConfig.supabasePublishableKey,
  ga4Id: runtimeGa4Id,
  tfjsBackend: 'wasm' as const,
};
