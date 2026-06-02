import { resolveRuntimeClientConfig } from '../../../shared/runtime-client-config';

const runtimeClientConfig = resolveRuntimeClientConfig();

export const environment = {
  environmentName: 'staging',
  production: true,
  siteUrl: runtimeClientConfig.siteUrl,
  apiBaseUrl: runtimeClientConfig.apiBaseUrl,
  pushNotificationsEnabled: true,
  pushNotificationsProvider: 'fcm',
  supabaseUrl: runtimeClientConfig.supabaseUrl,
  supabasePublishableKey: runtimeClientConfig.supabasePublishableKey,
  ga4Id: '',
};
