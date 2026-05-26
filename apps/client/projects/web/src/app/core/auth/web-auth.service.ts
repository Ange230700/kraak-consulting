import { isPlatformBrowser } from '@angular/common';
import {
  computed,
  Injectable,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
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
import { resolveApiBaseUrl } from '../runtime/runtime-config';

export const WEB_AUTH_STORAGE_KEY = 'kraak.web.session';

export interface PasswordRecoveryCompletionRequest {
  accessToken: string;
  newPassword: string;
}

export interface PasswordRecoveryCompletionResponse {
  success: boolean;
  message: string;
}

interface SupabaseVerifyRecoveryResponse {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
}

interface SupabasePasswordUpdateErrorResponse {
  msg?: string;
  error_description?: string;
  message?: string;
}

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

  async resolveRecoveryAccessTokenFromUrl(url?: URL): Promise<string | null> {
    const currentUrl = this.resolveUrl(url);

    if (!currentUrl) {
      return null;
    }

    const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ''));
    const queryParams = currentUrl.searchParams;

    const directToken = this.readDirectRecoveryToken(hashParams, queryParams);

    if (directToken) {
      return directToken;
    }

    const tokenHash =
      queryParams.get('token_hash') ?? hashParams.get('token_hash');
    const tokenType = queryParams.get('type') ?? hashParams.get('type');

    if (!tokenHash || (tokenType && tokenType !== 'recovery')) {
      return null;
    }

    return this.exchangeRecoveryTokenHash(tokenHash);
  }

  async completePasswordRecovery(
    body: PasswordRecoveryCompletionRequest,
  ): Promise<PasswordRecoveryCompletionResponse> {
    const accessToken = body.accessToken.trim();
    const newPassword = body.newPassword;

    if (!accessToken) {
      throw new Error('Le jeton de réinitialisation est requis.');
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      throw new Error(
        'Le mot de passe doit contenir entre 8 et 128 caractères.',
      );
    }

    const { supabaseUrl, supabasePublishableKey } = environment;

    if (!supabaseUrl) {
      throw new Error(
        'Configuration Supabase manquante pour finaliser la réinitialisation.',
      );
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    if (supabasePublishableKey) {
      headers['apikey'] = supabasePublishableKey;
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ password: newPassword }),
    });

    if (!response.ok) {
      throw new Error(await this.resolveSupabaseResponseError(response));
    }

    return {
      success: true,
      message:
        'Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter.',
    };
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
    } catch (error) {
      console.warn(
        '[WebAuthService] Impossible de parser la session locale, suppression du cache.',
        error,
      );
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
    } catch (error) {
      console.warn(
        '[WebAuthService] localStorage inaccessible dans ce contexte navigateur.',
        error,
      );
      return null;
    }
  }

  private resolveUrl(url?: URL): URL | null {
    if (url) {
      return url;
    }

    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      const browserWindow = globalThis.window;

      if (!browserWindow) {
        return null;
      }

      return new URL(browserWindow.location.href);
    } catch (error) {
      console.warn(
        '[WebAuthService] URL de la page introuvable pour la récupération du mot de passe.',
        error,
      );
      return null;
    }
  }

  private readDirectRecoveryToken(
    hashParams: URLSearchParams,
    queryParams: URLSearchParams,
  ): string | null {
    const hashToken = hashParams.get('access_token');
    const queryToken = queryParams.get('access_token');
    const hashType = hashParams.get('type');
    const queryType = queryParams.get('type');

    if (hashToken && (!hashType || hashType === 'recovery')) {
      return hashToken;
    }

    if (queryToken && (!queryType || queryType === 'recovery')) {
      return queryToken;
    }

    return null;
  }

  private async exchangeRecoveryTokenHash(
    tokenHash: string,
  ): Promise<string | null> {
    const { supabaseUrl, supabasePublishableKey } = environment;

    if (!supabaseUrl) {
      return null;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (supabasePublishableKey) {
      headers['apikey'] = supabasePublishableKey;
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'recovery',
        token_hash: tokenHash,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as SupabaseVerifyRecoveryResponse;
    return data.access_token?.trim() || null;
  }

  private async resolveSupabaseResponseError(
    response: Response,
  ): Promise<string> {
    try {
      const data =
        (await response.json()) as SupabasePasswordUpdateErrorResponse;
      return (
        data.error_description ||
        data.msg ||
        data.message ||
        'Impossible de mettre à jour le mot de passe.'
      );
    } catch (error) {
      console.warn(
        '[WebAuthService] Réponse erreur Supabase non JSON lors de la mise à jour du mot de passe.',
        error,
      );
      return 'Impossible de mettre à jour le mot de passe.';
    }
  }
}

export { resolveAuthErrorMessage } from '@kraak/api-client';
