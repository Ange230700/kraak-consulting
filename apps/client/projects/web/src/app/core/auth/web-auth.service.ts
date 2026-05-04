import { isPlatformBrowser } from '@angular/common';
import {
  computed,
  Injectable,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { ApiError, createApiClient } from '@kraak/api-client';
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
import { resolveApiBaseUrl } from '../runtime/runtime-config';

export const WEB_AUTH_STORAGE_KEY = 'kraak.web.session';

export { ApiError } from '@kraak/api-client';

@Injectable({
  providedIn: 'root',
})
export class WebAuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly restoredBundle = this.readStoredBundle();
  private readonly client = createApiClient({
    baseUrl: resolveApiBaseUrl(environment.apiBaseUrl),
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
    this.getStorage()?.removeItem(WEB_AUTH_STORAGE_KEY);
  }

  private storeBundle(bundle: AuthSessionBundleDto): void {
    this.sessionState.set(bundle.session);
    this.profileState.set(bundle.profile);
    this.persistBundle();
  }

  private persistBundle(): void {
    const storage = this.getStorage();
    const session = this.currentSession();
    const profile = this.currentProfile();

    if (!session || !profile) {
      storage?.removeItem(WEB_AUTH_STORAGE_KEY);
      return;
    }

    storage?.setItem(
      WEB_AUTH_STORAGE_KEY,
      JSON.stringify({ session, profile }),
    );
  }

  private readStoredBundle(): AuthSessionBundleDto | null {
    const storage = this.getStorage();
    const rawValue = storage?.getItem(WEB_AUTH_STORAGE_KEY) ?? null;

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
        storage?.removeItem(WEB_AUTH_STORAGE_KEY);
        return null;
      }

      return parsedValue;
    } catch {
      storage?.removeItem(WEB_AUTH_STORAGE_KEY);
      return null;
    }
  }

  private getStorage(): Storage | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      return localStorage;
    } catch {
      return null;
    }
  }
}

export function resolveAuthErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof ApiError && isObjectRecord(error.body)) {
    const body = error.body;

    if (
      'message' in body &&
      typeof body['message'] === 'string' &&
      body['message'].trim().length > 0
    ) {
      return body['message'];
    }

    if ('errors' in body && Array.isArray(body['errors'])) {
      const firstError = body['errors'].find(
        (value: unknown): value is string =>
          typeof value === 'string' && value.trim().length > 0,
      );

      if (firstError) {
        return firstError;
      }
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
