import type {
  AuthProfileDto,
  AuthSessionBundleDto,
  AuthSessionContextDto,
  AuthSessionTokensDto,
  PasswordResetResponseDto,
  SignUpResponseDto,
} from '@kraak/contracts';
import { describe, expect, it, vi } from 'vitest';
import {
  clearAuthBundle,
  getAndStoreSessionContext,
  persistAuthBundle,
  readStoredAuthBundle,
  refreshAndStoreBundle,
  requestAuthPasswordReset,
  signInAndStoreBundle,
  signUpAndStoreBundle,
  storeAuthBundle,
} from './auth-session-bundle';

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

describe('auth-session-bundle helpers', () => {
  it('Given a session bundle, When storeAuthBundle is called, Then state and persistence callbacks are executed', () => {
    const bundle = createBundle();
    const setSession = vi.fn();
    const setProfile = vi.fn();
    const persist = vi.fn();

    storeAuthBundle(bundle, setSession, setProfile, persist);

    expect(setSession).toHaveBeenCalledWith(bundle.session);
    expect(setProfile).toHaveBeenCalledWith(bundle.profile);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('Given an authenticated state, When clearAuthBundle is called, Then state is reset and storage is removed', () => {
    const setSession = vi.fn();
    const setProfile = vi.fn();
    const removeStoredBundle = vi.fn();

    clearAuthBundle(setSession, setProfile, removeStoredBundle);

    expect(setSession).toHaveBeenCalledWith(null);
    expect(setProfile).toHaveBeenCalledWith(null);
    expect(removeStoredBundle).toHaveBeenCalledTimes(1);
  });

  it('Given full state, When persistAuthBundle is called, Then it serializes and writes bundle', () => {
    const writeStoredBundle = vi.fn();
    const removeStoredBundle = vi.fn();
    const session = createSession();
    const profile = createProfile();

    persistAuthBundle(
      () => session,
      () => profile,
      writeStoredBundle,
      removeStoredBundle,
    );

    expect(writeStoredBundle).toHaveBeenCalledWith(
      JSON.stringify({ session, profile }),
    );
    expect(removeStoredBundle).not.toHaveBeenCalled();
  });

  it('Given missing session or profile, When persistAuthBundle is called, Then storage is removed', () => {
    const writeStoredBundle = vi.fn();
    const removeStoredBundle = vi.fn();

    persistAuthBundle(
      () => null,
      () => createProfile(),
      writeStoredBundle,
      removeStoredBundle,
    );
    persistAuthBundle(
      () => createSession(),
      () => null,
      writeStoredBundle,
      removeStoredBundle,
    );

    expect(writeStoredBundle).not.toHaveBeenCalled();
    expect(removeStoredBundle).toHaveBeenCalledTimes(2);
  });

  it('Given empty stored value, When readStoredAuthBundle is called, Then null is returned', () => {
    const removeStoredBundle = vi.fn();

    const result = readStoredAuthBundle(null, removeStoredBundle);

    expect(result).toBeNull();
    expect(removeStoredBundle).not.toHaveBeenCalled();
  });

  it('Given malformed JSON, When readStoredAuthBundle is called, Then parse callback and cleanup are triggered', () => {
    const removeStoredBundle = vi.fn();
    const onParseError = vi.fn();

    const result = readStoredAuthBundle(
      'not-json',
      removeStoredBundle,
      onParseError,
    );

    expect(result).toBeNull();
    expect(onParseError).toHaveBeenCalledTimes(1);
    expect(removeStoredBundle).toHaveBeenCalledTimes(1);
  });

  it('Given invalid bundle shape, When readStoredAuthBundle is called, Then null is returned and storage is cleared', () => {
    const removeStoredBundle = vi.fn();

    const result = readStoredAuthBundle(
      JSON.stringify({ session: { accessToken: 'x' }, profile: {} }),
      removeStoredBundle,
    );

    expect(result).toBeNull();
    expect(removeStoredBundle).toHaveBeenCalledTimes(1);
  });

  it('Given valid stored JSON, When readStoredAuthBundle is called, Then the bundle is restored', () => {
    const removeStoredBundle = vi.fn();
    const bundle = createBundle();

    const result = readStoredAuthBundle(
      JSON.stringify(bundle),
      removeStoredBundle,
    );

    expect(result).toEqual(bundle);
    expect(removeStoredBundle).not.toHaveBeenCalled();
  });

  it('Given sign-in succeeds, When signInAndStoreBundle is called, Then response is persisted and returned', async () => {
    const bundle = createBundle();
    const signIn = vi.fn().mockResolvedValue(bundle);
    const persistBundle = vi.fn();

    const result = await signInAndStoreBundle(
      signIn,
      { email: 'user@example.com', password: 'password123' },
      persistBundle,
    );

    expect(result).toEqual(bundle);
    expect(persistBundle).toHaveBeenCalledWith(bundle);
  });

  it('Given sign-up with session and profile, When signUpAndStoreBundle is called, Then bundle is persisted', async () => {
    const response: SignUpResponseDto = {
      message: 'ok',
      requiresEmailConfirmation: false,
      session: createSession(),
      profile: createProfile(),
    };
    const signUp = vi.fn().mockResolvedValue(response);
    const persistBundle = vi.fn();

    const result = await signUpAndStoreBundle(
      signUp,
      {
        email: 'user@example.com',
        password: 'password123',
        firstName: 'Ada',
        lastName: 'Lovelace',
      },
      persistBundle,
    );

    expect(result).toEqual(response);
    expect(persistBundle).toHaveBeenCalledWith({
      session: response.session!,
      profile: response.profile!,
    });
  });

  it('Given sign-up without session, When signUpAndStoreBundle is called, Then no bundle is persisted', async () => {
    const response: SignUpResponseDto = {
      message: 'confirmation required',
      requiresEmailConfirmation: true,
      session: null,
      profile: null,
    };
    const signUp = vi.fn().mockResolvedValue(response);
    const persistBundle = vi.fn();

    await signUpAndStoreBundle(
      signUp,
      {
        email: 'user@example.com',
        password: 'password123',
        firstName: 'Ada',
        lastName: 'Lovelace',
      },
      persistBundle,
    );

    expect(persistBundle).not.toHaveBeenCalled();
  });

  it('Given no current session, When refreshAndStoreBundle is called, Then null is returned', async () => {
    const refreshSession = vi.fn();
    const persistBundle = vi.fn();

    const result = await refreshAndStoreBundle(
      () => null,
      refreshSession,
      persistBundle,
    );

    expect(result).toBeNull();
    expect(refreshSession).not.toHaveBeenCalled();
    expect(persistBundle).not.toHaveBeenCalled();
  });

  it('Given a current session, When refreshAndStoreBundle is called, Then refreshed bundle is persisted', async () => {
    const bundle = createBundle();
    const refreshSession = vi.fn().mockResolvedValue(bundle);
    const persistBundle = vi.fn();

    const result = await refreshAndStoreBundle(
      () => createSession(),
      refreshSession,
      persistBundle,
    );

    expect(result).toEqual(bundle);
    expect(refreshSession).toHaveBeenCalledWith({
      refreshToken: 'refresh-token',
    });
    expect(persistBundle).toHaveBeenCalledWith(bundle);
  });

  it('Given a reset request, When requestAuthPasswordReset is called, Then it forwards payload and response', async () => {
    const response: PasswordResetResponseDto = {
      success: true,
      message: 'Email envoyé',
    };
    const requestPasswordReset = vi.fn().mockResolvedValue(response);

    const result = await requestAuthPasswordReset(requestPasswordReset, {
      email: 'user@example.com',
      redirectTo: 'https://example.com/reset',
    });

    expect(result).toEqual(response);
    expect(requestPasswordReset).toHaveBeenCalledWith({
      email: 'user@example.com',
      redirectTo: 'https://example.com/reset',
    });
  });

  it('Given no current session, When getAndStoreSessionContext is called, Then null is returned', async () => {
    const getSession = vi.fn();
    const setProfile = vi.fn();
    const persistBundle = vi.fn();

    const result = await getAndStoreSessionContext(
      () => null,
      getSession,
      setProfile,
      persistBundle,
    );

    expect(result).toBeNull();
    expect(getSession).not.toHaveBeenCalled();
    expect(setProfile).not.toHaveBeenCalled();
    expect(persistBundle).not.toHaveBeenCalled();
  });

  it('Given a current session, When getAndStoreSessionContext is called, Then profile is updated and persisted', async () => {
    const context: AuthSessionContextDto = {
      profile: createProfile('admin'),
    };
    const getSession = vi.fn().mockResolvedValue(context);
    const setProfile = vi.fn();
    const persistBundle = vi.fn();

    const result = await getAndStoreSessionContext(
      () => createSession(),
      getSession,
      setProfile,
      persistBundle,
    );

    expect(result).toEqual(context);
    expect(setProfile).toHaveBeenCalledWith(context.profile);
    expect(persistBundle).toHaveBeenCalledTimes(1);
  });
});
