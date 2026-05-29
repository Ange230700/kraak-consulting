export { createApiClient, ApiError } from './client.js';
export {
  clearAuthBundle,
  getAndStoreSessionContext,
  persistAuthBundle,
  readStoredAuthBundle,
  refreshAndStoreBundle,
  requestAuthPasswordReset,
  signInAndStoreBundle,
  signUpAndStoreBundle,
  storeAuthBundle,
} from './auth-session-bundle.js';
export { createAuthSessionActions } from './auth-session-actions.js';
export { createAuthSessionState, hasAuthRole } from './auth-session-state.js';
export { logDebugError } from './console-debug.js';
export { resolveAuthErrorMessage } from './resolve-auth-error.js';
export {
  createSignInForm,
  normalizeRequiredText,
  normalizeTextControl,
  submitSignInForm,
} from './sign-in-form.js';
export type {
  ApiClient,
  AuthClient,
  ContactClient,
  DashboardClient,
  ApiClientConfig,
  RequestOptions,
  ReadonlyResourceClient,
  CreatableResourceClient,
  FullResourceClient,
} from './client.js';
export type { AuthSessionActions } from './auth-session-actions.js';
