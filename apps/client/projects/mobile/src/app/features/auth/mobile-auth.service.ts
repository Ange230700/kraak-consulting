import { Injectable } from '@angular/core';
import {
  clearAuthBundle,
  createApiClient,
  createAuthSessionActions,
  type AuthSessionActions,
  createAuthSessionState,
  persistAuthBundle,
  readStoredAuthBundle,
  storeAuthBundle,
} from '@kraak/api-client';
import type {
  AuthSessionBundleDto,
  AuthSessionContextDto,
  PasswordResetRequestDto,
  PasswordResetResponseDto,
  SignInRequestDto,
  SignUpRequestDto,
  SignUpResponseDto,
  UserRoleValue,
} from '@kraak/contracts';
import { environment } from '../../../environments/environment';

export const MOBILE_AUTH_CALLBACK_URL = 'kraak://auth/callback';
export const MOBILE_AUTH_RESET_URL = 'kraak://auth/reset';
export const MOBILE_AUTH_STORAGE_KEY = 'kraak.mobile.session';

@Injectable({
  providedIn: 'root',
})
export class MobileAuthService {
  private readonly restoredBundle = this.readStoredBundle();
  private readonly authState = createAuthSessionState(this.restoredBundle);
  private _client: ReturnType<typeof createApiClient> | null = null;
  private get client(): ReturnType<typeof createApiClient> {
    this._client ??= createApiClient({
      baseUrl: environment.apiBaseUrl,
      getAuthToken: () => this.currentSession()?.accessToken ?? null,
    });
    return this._client;
  }

  private readonly sessionState = this.authState.sessionState;
  private readonly profileState = this.authState.profileState;

  readonly currentSession = this.authState.currentSession;
  readonly currentProfile = this.authState.currentProfile;
  readonly currentRole = this.authState.currentRole;
  readonly isAuthenticated = this.authState.isAuthenticated;
  readonly isParticipant = this.authState.isParticipant;
  readonly isAdmin = this.authState.isAdmin;

  private readonly mobileAuthClient = {
    signIn: (body: SignInRequestDto) => this.client.auth.signIn(body),
    signUp: (body: SignUpRequestDto) => this.client.auth.signUp(body),
    refreshSession: (body: { refreshToken: string }) =>
      this.client.auth.refreshSession(body),
    requestPasswordReset: (body: PasswordResetRequestDto) =>
      this.client.auth.requestPasswordReset(body),
    getSession: () => this.client.auth.getSession(),
  };

  private readonly authActions = createAuthSessionActions({
    currentRole: this.currentRole,
    currentSession: this.currentSession,
    authClient: this.mobileAuthClient,
    storeBundle: this.storeBundle.bind(this),
    setProfile: this.profileState.set,
    persistBundle: this.persistBundle.bind(this),
  });

  hasRole(...roles: UserRoleValue[]): boolean {
    const hasRole = this.authActions.hasRole;
    return hasRole(...roles);
  }

  async signIn(body: SignInRequestDto): Promise<AuthSessionBundleDto> {
    const signIn = this.authActions.signIn;
    return signIn(body);
  }

  async signUp(body: SignUpRequestDto): Promise<SignUpResponseDto> {
    const signUp = this.authActions.signUp;
    return signUp(body);
  }

  async refreshSession(): Promise<AuthSessionBundleDto | null> {
    return this.runAuthAction((actions) => actions.refreshSession());
  }

  async requestPasswordReset(
    body: PasswordResetRequestDto,
  ): Promise<PasswordResetResponseDto> {
    return this.runAuthAction((actions) => actions.requestPasswordReset(body));
  }

  async getSession(): Promise<AuthSessionContextDto | null> {
    return this.runAuthAction((actions) => actions.getSession());
  }

  clearSession(): void {
    clearAuthBundle(this.sessionState.set, this.profileState.set, () =>
      localStorage.removeItem(MOBILE_AUTH_STORAGE_KEY),
    );
  }

  private storeBundle(bundle: AuthSessionBundleDto): void {
    storeAuthBundle(
      bundle,
      this.sessionState.set,
      this.profileState.set,
      this.persistBundle.bind(this),
    );
  }

  private persistBundle(): void {
    persistAuthBundle(
      this.currentSession,
      this.currentProfile,
      (serializedBundle) =>
        localStorage.setItem(MOBILE_AUTH_STORAGE_KEY, serializedBundle),
      () => localStorage.removeItem(MOBILE_AUTH_STORAGE_KEY),
    );
  }

  private readStoredBundle(): AuthSessionBundleDto | null {
    return readStoredAuthBundle(
      localStorage.getItem(MOBILE_AUTH_STORAGE_KEY),
      () => localStorage.removeItem(MOBILE_AUTH_STORAGE_KEY),
    );
  }

  private runAuthAction<TResult>(
    action: (actions: AuthSessionActions) => TResult,
  ): TResult {
    return action(this.authActions);
  }
}

export { resolveAuthErrorMessage } from '@kraak/api-client';
