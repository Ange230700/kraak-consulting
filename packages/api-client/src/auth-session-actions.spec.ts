import type {
  AuthProfileDto,
  AuthSessionBundleDto,
  AuthSessionContextDto,
  AuthSessionTokensDto,
  PasswordResetResponseDto,
  SignUpResponseDto,
} from '@kraak/contracts';
import { describe, expect, it, vi } from 'vitest';
import { createAuthSessionActions } from './auth-session-actions';

function createSession(): AuthSessionTokensDto {
  return {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 3600,
    expiresAt: '2026-01-01T00:00:00.000Z',
    tokenType: 'bearer',
  };
}

function createProfile(
  role: 'participant' | 'admin' = 'participant',
): AuthProfileDto {
  return {
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
  };
}

function createBundle(): AuthSessionBundleDto {
  return {
    session: createSession(),
    profile: createProfile(),
  };
}

describe('auth-session-actions facade', () => {
  it('Given role and auth client methods, When actions are executed, Then they delegate and orchestrate persistence', async () => {
    const bundle = createBundle();
    const signUpResponse: SignUpResponseDto = {
      message: 'ok',
      requiresEmailConfirmation: false,
      session: bundle.session,
      profile: bundle.profile,
    };
    const resetResponse: PasswordResetResponseDto = {
      success: true,
      message: 'Email envoyé',
    };
    const context: AuthSessionContextDto = {
      profile: createProfile('admin'),
    };

    const authClient = {
      signIn: vi.fn().mockResolvedValue(bundle),
      signUp: vi.fn().mockResolvedValue(signUpResponse),
      refreshSession: vi.fn().mockResolvedValue(bundle),
      requestPasswordReset: vi.fn().mockResolvedValue(resetResponse),
      getSession: vi.fn().mockResolvedValue(context),
    };

    const storeBundle = vi.fn();
    const setProfile = vi.fn();
    const persistBundle = vi.fn();

    const actions = createAuthSessionActions({
      currentRole: () => 'participant',
      currentSession: () => createSession(),
      authClient,
      storeBundle,
      setProfile,
      persistBundle,
    });

    expect(actions.hasRole('participant')).toBe(true);
    expect(actions.hasRole('admin')).toBe(false);

    await expect(
      actions.signIn({ email: 'user@example.com', password: 'password123' }),
    ).resolves.toEqual(bundle);
    expect(authClient.signIn).toHaveBeenCalledTimes(1);

    await expect(
      actions.signUp({
        email: 'user@example.com',
        password: 'password123',
        firstName: 'Ada',
        lastName: 'Lovelace',
      }),
    ).resolves.toEqual(signUpResponse);

    await expect(actions.refreshSession()).resolves.toEqual(bundle);
    await expect(
      actions.requestPasswordReset({ email: 'user@example.com' }),
    ).resolves.toEqual(resetResponse);
    await expect(actions.getSession()).resolves.toEqual(context);

    expect(storeBundle).toHaveBeenCalledTimes(3);
    expect(setProfile).toHaveBeenCalledWith(context.profile);
    expect(persistBundle).toHaveBeenCalledTimes(1);
  });

  it('Given no current session, When refreshSession or getSession are called, Then null is returned without remote calls', async () => {
    const authClient = {
      signIn: vi.fn(),
      signUp: vi.fn(),
      refreshSession: vi.fn(),
      requestPasswordReset: vi.fn(),
      getSession: vi.fn(),
    };

    const actions = createAuthSessionActions({
      currentRole: () => null,
      currentSession: () => null,
      authClient,
      storeBundle: vi.fn(),
      setProfile: vi.fn(),
      persistBundle: vi.fn(),
    });

    await expect(actions.refreshSession()).resolves.toBeNull();
    await expect(actions.getSession()).resolves.toBeNull();
    expect(authClient.refreshSession).not.toHaveBeenCalled();
    expect(authClient.getSession).not.toHaveBeenCalled();
  });
});
