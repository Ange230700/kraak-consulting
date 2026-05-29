import type {
  AuthProfileDto,
  AuthSessionBundleDto,
  AuthSessionContextDto,
  AuthSessionTokensDto,
  PasswordResetRequestDto,
  PasswordResetResponseDto,
  SignInRequestDto,
  SignUpRequestDto,
  SignUpResponseDto,
  UserRoleValue,
} from '@kraak/contracts';

import type { AuthClient } from './client.js';
import {
  getAndStoreSessionContext,
  refreshAndStoreBundle,
  requestAuthPasswordReset,
  signInAndStoreBundle,
  signUpAndStoreBundle,
} from './auth-session-bundle.js';
import { hasAuthRole } from './auth-session-state.js';

type AuthClientMethods = Pick<
  AuthClient,
  'signIn' | 'signUp' | 'refreshSession' | 'requestPasswordReset' | 'getSession'
>;

interface AuthSessionActionsOptions {
  currentRole: () => UserRoleValue | null;
  currentSession: () => AuthSessionTokensDto | null;
  authClient: AuthClientMethods;
  storeBundle: (bundle: AuthSessionBundleDto) => void;
  setProfile: (profile: AuthProfileDto | null) => void;
  persistBundle: () => void;
}

export interface AuthSessionActions {
  hasRole: (...roles: UserRoleValue[]) => boolean;
  signIn: (body: SignInRequestDto) => Promise<AuthSessionBundleDto>;
  signUp: (body: SignUpRequestDto) => Promise<SignUpResponseDto>;
  refreshSession: () => Promise<AuthSessionBundleDto | null>;
  requestPasswordReset: (
    body: PasswordResetRequestDto,
  ) => Promise<PasswordResetResponseDto>;
  getSession: () => Promise<AuthSessionContextDto | null>;
}

export function createAuthSessionActions(
  options: AuthSessionActionsOptions,
): AuthSessionActions {
  return {
    hasRole: (...roles: UserRoleValue[]) =>
      hasAuthRole(options.currentRole(), roles),
    signIn: (body: SignInRequestDto) =>
      signInAndStoreBundle(
        options.authClient.signIn,
        body,
        options.storeBundle,
      ),
    signUp: (body: SignUpRequestDto) =>
      signUpAndStoreBundle(
        options.authClient.signUp,
        body,
        options.storeBundle,
      ),
    refreshSession: () =>
      refreshAndStoreBundle(
        options.currentSession,
        options.authClient.refreshSession,
        options.storeBundle,
      ),
    requestPasswordReset: (body: PasswordResetRequestDto) =>
      requestAuthPasswordReset(options.authClient.requestPasswordReset, body),
    getSession: () =>
      getAndStoreSessionContext(
        options.currentSession,
        options.authClient.getSession,
        options.setProfile,
        options.persistBundle,
      ),
  };
}
