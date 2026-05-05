import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MobileAuthService,
  MOBILE_AUTH_STORAGE_KEY,
} from './mobile-auth.service';

describe('MobileAuthService', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Given a successful sign-in, when the service stores the returned bundle, then the mobile session becomes available locally', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        session: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
          expiresAt: '2026-04-14T12:00:00.000Z',
          tokenType: 'bearer',
        },
        profile: {
          appUser: {
            id: 'user-1',
            email: 'alice@example.com',
            role: 'participant',
            firstName: 'Alice',
            lastName: 'Dupont',
            phone: null,
            preferredContactChannel: null,
            isActive: true,
            createdAt: '2026-04-14T12:00:00.000Z',
            updatedAt: '2026-04-14T12:00:00.000Z',
          },
          participant: null,
        },
      }),
    } satisfies Partial<Response>);

    TestBed.configureTestingModule({});
    const service = TestBed.inject(MobileAuthService);

    await service.signIn({
      email: 'alice@example.com',
      password: 'motdepasse-securise',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/auth/sign-in',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(service.currentProfile()?.appUser.email).toBe('alice@example.com');
    expect(localStorage.getItem('kraak.mobile.session')).toContain(
      'access-token',
    );
    expect(service.currentRole()).toBe('participant');
    expect(service.isParticipant()).toBe(true);
    expect(service.isAdmin()).toBe(false);
    expect(service.hasRole('participant')).toBe(true);
    expect(service.hasRole('admin')).toBe(false);
  });

  it('Given an admin sign-in payload, when the session is stored, then admin permissions are exposed', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        session: {
          accessToken: 'admin-access-token',
          refreshToken: 'admin-refresh-token',
          expiresIn: 3600,
          expiresAt: '2026-04-14T12:00:00.000Z',
          tokenType: 'bearer',
        },
        profile: {
          appUser: {
            id: 'admin-user-1',
            email: 'admin@example.com',
            role: 'admin',
            firstName: 'Admin',
            lastName: 'Kraak',
            phone: null,
            preferredContactChannel: null,
            isActive: true,
            createdAt: '2026-04-14T12:00:00.000Z',
            updatedAt: '2026-04-14T12:00:00.000Z',
          },
          participant: null,
        },
      }),
    } satisfies Partial<Response>);

    TestBed.configureTestingModule({});
    const service = TestBed.inject(MobileAuthService);

    await service.signIn({
      email: 'admin@example.com',
      password: 'motdepasse-securise',
    });

    expect(service.currentRole()).toBe('admin');
    expect(service.isAdmin()).toBe(true);
    expect(service.isParticipant()).toBe(false);
    expect(service.hasRole('admin')).toBe(true);
    expect(service.hasRole('participant')).toBe(false);
  });

  describe('Given a successful sign-up with session', () => {
    it('when the API returns a session and profile, then the bundle is stored and isAuthenticated becomes true', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          session: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiresIn: 3600,
            expiresAt: '2026-04-28T12:00:00.000Z',
            tokenType: 'bearer',
          },
          profile: {
            appUser: {
              id: 'user-1',
              email: 'alice@example.com',
              role: 'participant',
              firstName: 'Alice',
              lastName: 'Dupont',
              phone: null,
              preferredContactChannel: null,
              isActive: true,
              createdAt: '2026-04-28T12:00:00.000Z',
              updatedAt: '2026-04-28T12:00:00.000Z',
            },
            participant: null,
          },
          requiresEmailConfirmation: false,
        }),
      } satisfies Partial<Response>);

      TestBed.configureTestingModule({});
      const service = TestBed.inject(MobileAuthService);

      const result = await service.signUp({
        email: 'alice@example.com',
        password: 'motdepasse-securise',
        firstName: 'Alice',
        lastName: 'Dupont',
      });

      expect(service.isAuthenticated()).toBe(true);
      expect(result.session?.accessToken).toBe('access-token');
    });

    it('when the API returns no session, then isAuthenticated stays false', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          session: null,
          profile: null,
          requiresEmailConfirmation: true,
        }),
      } satisfies Partial<Response>);

      TestBed.configureTestingModule({});
      const service = TestBed.inject(MobileAuthService);

      await service.signUp({
        email: 'alice@example.com',
        password: 'motdepasse-securise',
        firstName: 'Alice',
        lastName: 'Dupont',
      });

      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('Given refreshSession', () => {
    it('when currentSession is null, then refreshSession returns null without calling the API', async () => {
      TestBed.configureTestingModule({});
      const service = TestBed.inject(MobileAuthService);

      const result = await service.refreshSession();

      expect(result).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('when a session exists, then refreshSession calls the API and updates the bundle', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          session: {
            accessToken: 'old-token',
            refreshToken: 'refresh-token',
            expiresIn: 3600,
            expiresAt: '2026-04-28T12:00:00.000Z',
            tokenType: 'bearer',
          },
          profile: {
            appUser: {
              id: 'user-1',
              email: 'alice@example.com',
              role: 'participant',
              firstName: 'Alice',
              lastName: 'Dupont',
              phone: null,
              preferredContactChannel: null,
              isActive: true,
              createdAt: '2026-04-28T12:00:00.000Z',
              updatedAt: '2026-04-28T12:00:00.000Z',
            },
            participant: null,
          },
        }),
      } satisfies Partial<Response>);

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          session: {
            accessToken: 'new-token',
            refreshToken: 'new-refresh-token',
            expiresIn: 3600,
            expiresAt: '2026-04-29T12:00:00.000Z',
            tokenType: 'bearer',
          },
          profile: {
            appUser: {
              id: 'user-1',
              email: 'alice@example.com',
              role: 'participant',
              firstName: 'Alice',
              lastName: 'Dupont',
              phone: null,
              preferredContactChannel: null,
              isActive: true,
              createdAt: '2026-04-28T12:00:00.000Z',
              updatedAt: '2026-04-28T12:00:00.000Z',
            },
            participant: null,
          },
        }),
      } satisfies Partial<Response>);

      TestBed.configureTestingModule({});
      const service = TestBed.inject(MobileAuthService);

      await service.signIn({ email: 'alice@example.com', password: 'pass' });
      expect(service.currentSession()?.accessToken).toBe('old-token');

      const bundle = await service.refreshSession();
      expect(bundle?.session.accessToken).toBe('new-token');
      expect(service.currentSession()?.accessToken).toBe('new-token');
    });
  });

  describe('Given requestPasswordReset', () => {
    it('when called, then the API receives the request and returns the response', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'Email envoyé.' }),
      } satisfies Partial<Response>);

      TestBed.configureTestingModule({});
      const service = TestBed.inject(MobileAuthService);

      const result = await service.requestPasswordReset({
        email: 'alice@example.com',
      });
      expect(result).toMatchObject({ success: true });
    });
  });

  describe('Given getSession', () => {
    it('when currentSession is null, then getSession returns null without calling the API', async () => {
      TestBed.configureTestingModule({});
      const service = TestBed.inject(MobileAuthService);

      const result = await service.getSession();
      expect(result).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('when a session exists, then getSession calls the API and updates profileState', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          session: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiresIn: 3600,
            expiresAt: '2026-04-28T12:00:00.000Z',
            tokenType: 'bearer',
          },
          profile: {
            appUser: {
              id: 'user-1',
              email: 'alice@example.com',
              role: 'participant',
              firstName: 'Alice',
              lastName: 'Dupont',
              phone: null,
              preferredContactChannel: null,
              isActive: true,
              createdAt: '2026-04-28T12:00:00.000Z',
              updatedAt: '2026-04-28T12:00:00.000Z',
            },
            participant: null,
          },
        }),
      } satisfies Partial<Response>);

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          session: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiresIn: 3600,
            expiresAt: '2026-04-28T12:00:00.000Z',
            tokenType: 'bearer',
          },
          profile: {
            appUser: {
              id: 'user-1',
              email: 'updated@example.com',
              role: 'participant',
              firstName: 'Alice',
              lastName: 'Dupont',
              phone: null,
              preferredContactChannel: null,
              isActive: true,
              createdAt: '2026-04-28T12:00:00.000Z',
              updatedAt: '2026-04-29T12:00:00.000Z',
            },
            participant: null,
          },
        }),
      } satisfies Partial<Response>);

      TestBed.configureTestingModule({});
      const service = TestBed.inject(MobileAuthService);

      await service.signIn({ email: 'alice@example.com', password: 'pass' });
      const ctx = await service.getSession();
      expect(ctx?.profile.appUser.email).toBe('updated@example.com');
    });
  });

  describe('Given clearSession', () => {
    it('when called after sign-in, then isAuthenticated becomes false and localStorage is cleared', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          session: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiresIn: 3600,
            expiresAt: '2026-04-28T12:00:00.000Z',
            tokenType: 'bearer',
          },
          profile: {
            appUser: {
              id: 'user-1',
              email: 'alice@example.com',
              role: 'participant',
              firstName: 'Alice',
              lastName: 'Dupont',
              phone: null,
              preferredContactChannel: null,
              isActive: true,
              createdAt: '2026-04-28T12:00:00.000Z',
              updatedAt: '2026-04-28T12:00:00.000Z',
            },
            participant: null,
          },
        }),
      } satisfies Partial<Response>);

      TestBed.configureTestingModule({});
      const service = TestBed.inject(MobileAuthService);

      await service.signIn({ email: 'alice@example.com', password: 'pass' });
      expect(service.isAuthenticated()).toBe(true);

      service.clearSession();

      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem(MOBILE_AUTH_STORAGE_KEY)).toBeNull();
    });
  });

  describe('Given a stored session with missing required fields', () => {
    it('when session.accessToken is missing, then the bundle is cleared and isAuthenticated is false', () => {
      localStorage.setItem(
        MOBILE_AUTH_STORAGE_KEY,
        JSON.stringify({
          session: { refreshToken: 'r', expiresAt: 'e', tokenType: 'bearer' },
          profile: { appUser: { id: 'user-1' }, participant: null },
        }),
      );

      TestBed.configureTestingModule({});
      const service = TestBed.inject(MobileAuthService);

      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem(MOBILE_AUTH_STORAGE_KEY)).toBeNull();
    });

    it('when session.refreshToken is missing, then the bundle is cleared and isAuthenticated is false', () => {
      localStorage.setItem(
        MOBILE_AUTH_STORAGE_KEY,
        JSON.stringify({
          session: { accessToken: 'a', expiresAt: 'e', tokenType: 'bearer' },
          profile: { appUser: { id: 'user-1' }, participant: null },
        }),
      );

      TestBed.configureTestingModule({});
      const service = TestBed.inject(MobileAuthService);

      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem(MOBILE_AUTH_STORAGE_KEY)).toBeNull();
    });

    it('when profile.appUser.id is missing, then the bundle is cleared and isAuthenticated is false', () => {
      localStorage.setItem(
        MOBILE_AUTH_STORAGE_KEY,
        JSON.stringify({
          session: {
            accessToken: 'a',
            refreshToken: 'r',
            expiresAt: 'e',
            tokenType: 'bearer',
          },
          profile: {
            appUser: { email: 'alice@example.com' },
            participant: null,
          },
        }),
      );

      TestBed.configureTestingModule({});
      const service = TestBed.inject(MobileAuthService);

      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem(MOBILE_AUTH_STORAGE_KEY)).toBeNull();
    });

    it('when the stored value is corrupted JSON, then the bundle is cleared and isAuthenticated is false', () => {
      localStorage.setItem(MOBILE_AUTH_STORAGE_KEY, 'not-valid-json');

      TestBed.configureTestingModule({});
      const service = TestBed.inject(MobileAuthService);

      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem(MOBILE_AUTH_STORAGE_KEY)).toBeNull();
    });
  });
});
