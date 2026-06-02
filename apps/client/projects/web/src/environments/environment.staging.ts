import { resolveRuntimeClientConfig } from '../../../shared/runtime-client-config';

const runtimeClientConfig = resolveRuntimeClientConfig();

export const environment = {
  production: true,
  enableParticipantArea: true,
  siteUrl: runtimeClientConfig.siteUrl,
  apiBaseUrl: runtimeClientConfig.apiBaseUrl,
  supabaseUrl: runtimeClientConfig.supabaseUrl,
  supabasePublishableKey: runtimeClientConfig.supabasePublishableKey,
  ga4Id: '',
  tfjsBackend: 'cpu' as const,
};
