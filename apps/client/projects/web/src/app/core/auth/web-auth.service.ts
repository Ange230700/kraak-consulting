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
