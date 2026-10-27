import type { AuthSessionBundleDto } from '@kraak/contracts';
import { describe, expect, it } from 'vitest';
import { createAuthSessionState, hasAuthRole } from './auth-session-state';

function createBundle(
  role: 'participant' | 'admin' = 'participant',
): AuthSessionBundleDto {
  return {
    session: {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      expiresAt: '2026-01-01T00:00:00.000Z',
      tokenType: 'bearer',
    },
    profile: {
      appUser: {
        id: 'user-1',
        email: 'user@example.com',
        role,
        firstName: 'Ada',
        lastName: 'Lovelace',
        phone: null,
        preferredContactChannel: null,
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      participant: null,
    },
  };
}

describe('auth-session-state', () => {
  it('Given a restored participant bundle, When state is created, Then auth and role signals are derived correctly', () => {
    const state = createAuthSessionState(createBundle('participant'));

    expect(state.currentSession()).not.toBeNull();
    expect(state.currentProfile()?.appUser.email).toBe('user@example.com');
    expect(state.currentRole()).toBe('participant');
    expect(state.isAuthenticated()).toBe(true);
    expect(state.isParticipant()).toBe(true);
    expect(state.isAdmin()).toBe(false);
  });

  it('Given an empty restored bundle, When state is created, Then auth is unauthenticated by default', () => {
    const state = createAuthSessionState(null);

    expect(state.currentSession()).toBeNull();
    expect(state.currentProfile()).toBeNull();
    expect(state.currentRole()).toBeNull();
    expect(state.isAuthenticated()).toBe(false);
    expect(state.isParticipant()).toBe(false);
    expect(state.isAdmin()).toBe(false);
  });

  it('Given role changes in signals, When state updates, Then computed role and flags follow new values', () => {
    const state = createAuthSessionState(createBundle('participant'));

    state.profileState.set(createBundle('admin').profile);
    expect(state.currentRole()).toBe('admin');
    expect(state.isParticipant()).toBe(false);
    expect(state.isAdmin()).toBe(true);

    state.sessionState.set(null);
    expect(state.isAuthenticated()).toBe(false);
  });

  it('Given role guard checks, When hasAuthRole is called, Then membership logic is respected', () => {
    expect(hasAuthRole('admin', ['admin', 'trainer'])).toBe(true);
    expect(hasAuthRole('participant', ['admin', 'trainer'])).toBe(false);
    expect(hasAuthRole(null, ['participant'])).toBe(false);
  });
});
