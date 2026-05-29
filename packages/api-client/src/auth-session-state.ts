import {
  computed,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import type {
  AuthProfileDto,
  AuthSessionBundleDto,
  AuthSessionTokensDto,
  UserRoleValue,
} from '@kraak/contracts';

export interface AuthSessionState {
  sessionState: WritableSignal<AuthSessionTokensDto | null>;
  profileState: WritableSignal<AuthProfileDto | null>;
  currentSession: Signal<AuthSessionTokensDto | null>;
  currentProfile: Signal<AuthProfileDto | null>;
  currentRole: Signal<UserRoleValue | null>;
  isAuthenticated: Signal<boolean>;
  isParticipant: Signal<boolean>;
  isAdmin: Signal<boolean>;
}

export function createAuthSessionState(
  restoredBundle: AuthSessionBundleDto | null,
): AuthSessionState {
  const sessionState = signal<AuthSessionTokensDto | null>(
    restoredBundle?.session ?? null,
  );
  const profileState = signal<AuthProfileDto | null>(
    restoredBundle?.profile ?? null,
  );
  const currentSession = sessionState.asReadonly();
  const currentProfile = profileState.asReadonly();
  const currentRole = computed<UserRoleValue | null>(
    () => currentProfile()?.appUser.role ?? null,
  );
  const isAuthenticated = computed(
    () => currentSession() !== null && currentProfile() !== null,
  );
  const isParticipant = computed(() => currentRole() === 'participant');
  const isAdmin = computed(() => currentRole() === 'admin');

  return {
    sessionState,
    profileState,
    currentSession,
    currentProfile,
    currentRole,
    isAuthenticated,
    isParticipant,
    isAdmin,
  };
}

export function hasAuthRole(
  role: UserRoleValue | null,
  roles: readonly UserRoleValue[],
): boolean {
  return role !== null && roles.includes(role);
}
