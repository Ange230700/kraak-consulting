import { computed, Injectable, signal } from '@angular/core';
import { createApiClient } from '@kraak/api-client';
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
import { environment } from '../../../environments/environment';

export const MOBILE_AUTH_CALLBACK_URL = 'kraak://auth/callback';
export const MOBILE_AUTH_RESET_URL = 'kraak://auth/reset';
export const MOBILE_AUTH_STORAGE_KEY = 'kraak.mobile.session';

@Injectable({
  providedIn: 'root',
})
export class MobileAuthService {
  private readonly restoredBundle = this.readStoredBundle();
  private readonly client = createApiClient({
    baseUrl: environment.apiBaseUrl,
    getAuthToken: () => this.currentSession()?.accessToken ?? null,
  });
  private readonly sessionState = signal<AuthSessionTokensDto | null>(
    this.restoredBundle?.session ?? null,
  );
  private readonly profileState = signal<AuthProfileDto | null>(
    this.restoredBundle?.profile ?? null,
  );

  readonly currentSession = this.sessionState.asReadonly();
  readonly currentProfile = this.profileState.asReadonly();
  readonly currentRole = computed<UserRoleValue | null>(
    () => this.currentProfile()?.appUser.role ?? null,
  );
  readonly isAuthenticated = computed(
    () => this.currentSession() !== null && this.currentProfile() !== null,
  );
  readonly isParticipant = computed(() => this.currentRole() === 'participant');
  readonly isAdmin = computed(() => this.currentRole() === 'admin');

  hasRole(...roles: UserRoleValue[]): boolean {
    const role = this.currentRole();
    return role !== null && roles.includes(role);
  }

  async signIn(body: SignInRequestDto): Promise<AuthSessionBundleDto> {
    const bundle = await this.client.auth.signIn(body);
    this.storeBundle(bundle);
    return bundle;
  }

  async signUp(body: SignUpRequestDto): Promise<SignUpResponseDto> {
    const response = await this.client.auth.signUp(body);

    if (response.session && response.profile) {
      this.storeBundle({
        session: response.session,
        profile: response.profile,
      });
    }

    return response;
  }

  async refreshSession(): Promise<AuthSessionBundleDto | null> {
    const session = this.currentSession();

    if (!session) {
      return null;
    }

    const bundle = await this.client.auth.refreshSession({
      refreshToken: session.refreshToken,
    });

    this.storeBundle(bundle);
    return bundle;
  }

  async requestPasswordReset(
    body: PasswordResetRequestDto,
  ): Promise<PasswordResetResponseDto> {
    return this.client.auth.requestPasswordReset(body);
  }

  async getSession(): Promise<AuthSessionContextDto | null> {
    if (!this.currentSession()) {
      return null;
    }

    const context = await this.client.auth.getSession();
    this.profileState.set(context.profile);
    this.persistBundle();

    return context;
  }

  clearSession(): void {
    this.sessionState.set(null);
    this.profileState.set(null);
    localStorage.removeItem(MOBILE_AUTH_STORAGE_KEY);
  }

  private storeBundle(bundle: AuthSessionBundleDto): void {
    this.sessionState.set(bundle.session);
    this.profileState.set(bundle.profile);
    this.persistBundle();
  }

  private persistBundle(): void {
    const session = this.currentSession();
    const profile = this.currentProfile();

    if (!session || !profile) {
      localStorage.removeItem(MOBILE_AUTH_STORAGE_KEY);
      return;
    }

    localStorage.setItem(
      MOBILE_AUTH_STORAGE_KEY,
      JSON.stringify({
        session,
        profile,
      }),
    );
  }

  private readStoredBundle(): AuthSessionBundleDto | null {
    const rawValue = localStorage.getItem(MOBILE_AUTH_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    try {
      const parsedValue = JSON.parse(rawValue) as AuthSessionBundleDto;

      if (
        !parsedValue.session?.accessToken ||
        !parsedValue.session?.refreshToken ||
        !parsedValue.profile?.appUser?.id
      ) {
        localStorage.removeItem(MOBILE_AUTH_STORAGE_KEY);
        return null;
      }

      return parsedValue;
    } catch {
      localStorage.removeItem(MOBILE_AUTH_STORAGE_KEY);
      return null;
    }
  }
}

export { resolveAuthErrorMessage } from '@kraak/api-client';
