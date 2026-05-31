import { isPlatformBrowser } from '@angular/common';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import {
  clearAuthBundle,
  createApiClient,
  createAuthSessionActions,
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
  private readonly authState = createAuthSessionState(this.restoredBundle);
  private readonly client = createApiClient({
    baseUrl: resolveApiBaseUrl(environment.apiBaseUrl),
    getAuthToken: () => this.currentSession()?.accessToken ?? null,
  });
  private readonly sessionState = this.authState.sessionState;
  private readonly profileState = this.authState.profileState;

  readonly currentSession = this.authState.currentSession;
  readonly currentProfile = this.authState.currentProfile;
  readonly currentRole = this.authState.currentRole;
  readonly isAuthenticated = this.authState.isAuthenticated;
  readonly isParticipant = this.authState.isParticipant;
  readonly isAdmin = this.authState.isAdmin;

  private readonly authActions = this.createAuthActions();

  readonly hasRole = (...roles: UserRoleValue[]): boolean =>
    this.authActions.hasRole(...roles);

  readonly signIn = (body: SignInRequestDto): Promise<AuthSessionBundleDto> =>
    this.authActions.signIn(body);

  readonly signUp = (body: SignUpRequestDto): Promise<SignUpResponseDto> =>
    this.authActions.signUp(body);

  readonly refreshSession = (): Promise<AuthSessionBundleDto | null> =>
    this.authActions.refreshSession();

  readonly requestPasswordReset = (
    body: PasswordResetRequestDto,
  ): Promise<PasswordResetResponseDto> =>
    this.authActions.requestPasswordReset(body);

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
    return this.authActions.getSession();
  }

  clearSession(): void {
    clearAuthBundle(this.sessionState.set, this.profileState.set, () =>
      this.getStorage()?.removeItem(WEB_AUTH_STORAGE_KEY),
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
    const storage = this.getStorage();
    persistAuthBundle(
      this.currentSession,
      this.currentProfile,
      (serializedBundle) =>
        storage?.setItem(WEB_AUTH_STORAGE_KEY, serializedBundle),
      () => storage?.removeItem(WEB_AUTH_STORAGE_KEY),
    );
  }

  private readStoredBundle(): AuthSessionBundleDto | null {
    const storage = this.getStorage();
    return readStoredAuthBundle(
      storage?.getItem(WEB_AUTH_STORAGE_KEY) ?? null,
      () => storage?.removeItem(WEB_AUTH_STORAGE_KEY),
      (error) => {
        console.warn(
          '[WebAuthService] Impossible de parser la session locale, suppression du cache.',
          error,
        );
      },
    );
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
      return new URL(browserWindow.location.href);
    } catch (error) {
      console.warn(
        '[WebAuthService] URL de la page introuvable pour la récupération du mot de passe.',
        error,
      );
      return null;
    }
  }

  private createAuthActions() {
    return createAuthSessionActions({
      currentRole: this.currentRole,
      currentSession: this.currentSession,
      authClient: this.client.auth,
      storeBundle: this.storeBundle.bind(this),
      setProfile: this.profileState.set,
      persistBundle: this.persistBundle.bind(this),
    });
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
