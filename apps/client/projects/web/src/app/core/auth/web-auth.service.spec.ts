import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebAuthService, WEB_AUTH_STORAGE_KEY } from './web-auth.service';

describe('WebAuthService', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Given a successful sign-in', () => {
    it('when the service stores the returned bundle, then the web session becomes available locally', async () => {
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
      const service = TestBed.inject(WebAuthService);

      await service.signIn({
        email: 'alice@example.com',
        password: 'motdepasse-securise',
      });

      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentSession()?.accessToken).toBe('access-token');
      expect(service.currentProfile()?.appUser.email).toBe('alice@example.com');
    });

    it('when the bundle is stored, then the session is persisted in localStorage', async () => {
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
      const service = TestBed.inject(WebAuthService);

      await service.signIn({
        email: 'alice@example.com',
        password: 'motdepasse-securise',
      });

      const stored = localStorage.getItem(WEB_AUTH_STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored ?? '{}');
      expect(parsed.session.accessToken).toBe('access-token');
    });

    it('when the stored profile role is participant, then role helpers are resolved correctly', async () => {
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
      const service = TestBed.inject(WebAuthService);

      await service.signIn({
        email: 'alice@example.com',
        password: 'motdepasse-securise',
      });

      expect(service.currentRole()).toBe('participant');
      expect(service.isParticipant()).toBe(true);
      expect(service.isAdmin()).toBe(false);
      expect(service.hasRole('participant')).toBe(true);
      expect(service.hasRole('admin')).toBe(false);
    });

    it('when the stored profile role is admin, then role helpers detect admin access', async () => {
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
              id: 'user-2',
              email: 'admin@example.com',
              role: 'admin',
              firstName: 'Admin',
              lastName: 'Kraak',
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
      const service = TestBed.inject(WebAuthService);

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
  });

  describe('Given an authenticated session', () => {
    it('when clearSession is called, then isAuthenticated becomes false and localStorage is cleared', async () => {
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
      const service = TestBed.inject(WebAuthService);

      await service.signIn({
        email: 'alice@example.com',
        password: 'motdepasse-securise',
      });

      service.clearSession();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentSession()).toBeNull();
      expect(service.currentProfile()).toBeNull();
      expect(localStorage.getItem(WEB_AUTH_STORAGE_KEY)).toBeNull();
    });
  });

  describe('Given no stored session', () => {
    it('when the service is initialised, then isAuthenticated is false', () => {
      TestBed.configureTestingModule({});
      const service = TestBed.inject(WebAuthService);

      expect(service.isAuthenticated()).toBe(false);
    });

    it('when a valid stored bundle exists, then it is restored and authentication is true', () => {
      localStorage.setItem(
        WEB_AUTH_STORAGE_KEY,
        JSON.stringify({
          session: {
            accessToken: 'stored-access-token',
            refreshToken: 'stored-refresh-token',
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
      );

      TestBed.configureTestingModule({});
      const service = TestBed.inject(WebAuthService);

      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentSession()?.accessToken).toBe('stored-access-token');
      expect(service.currentProfile()?.appUser.id).toBe('user-1');
    });
  });

  describe('Given a stored session with a corrupted payload', () => {
    it('when the service is initialised, then the corrupted entry is cleared and isAuthenticated is false', () => {
      localStorage.setItem(WEB_AUTH_STORAGE_KEY, 'not-valid-json');

      TestBed.configureTestingModule({});
      const service = TestBed.inject(WebAuthService);

      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem(WEB_AUTH_STORAGE_KEY)).toBeNull();
    });
  });

  describe('Given the service runs during prerender', () => {
    it('when browser storage is unavailable, then initialisation falls back to an anonymous session state', () => {
      vi.stubGlobal('localStorage', undefined);

      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });

      const service = TestBed.inject(WebAuthService);

      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentSession()).toBeNull();
      expect(service.currentProfile()).toBeNull();
    });
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
      const service = TestBed.inject(WebAuthService);

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
      const service = TestBed.inject(WebAuthService);

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
      const service = TestBed.inject(WebAuthService);

      const result = await service.refreshSession();

      expect(result).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('when a session exists, then refreshSession calls the API and updates the bundle', async () => {
      // First sign in
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

      // Then refresh
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
      const service = TestBed.inject(WebAuthService);

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
      const service = TestBed.inject(WebAuthService);

      const result = await service.requestPasswordReset({
        email: 'alice@example.com',
      });
      expect(result).toMatchObject({ success: true });
    });
  });

  describe('Given resolveRecoveryAccessTokenFromUrl', () => {
    it('when URL hash contains access_token with recovery type, then token is returned directly', async () => {
      TestBed.configureTestingModule({});
      const service = TestBed.inject(WebAuthService);

      const token = await service.resolveRecoveryAccessTokenFromUrl(
        new URL(
          'https://kraak.example/auth/reset#access_token=recovery-123&type=recovery',
        ),
      );

      expect(token).toBe('recovery-123');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('when URL contains token_hash, then verify endpoint is called and exchanged token is returned', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'exchanged-token' }),
      } satisfies Partial<Response>);

      TestBed.configureTestingModule({});
      const service = TestBed.inject(WebAuthService);

      const token = await service.resolveRecoveryAccessTokenFromUrl(
        new URL(
          'https://kraak.example/auth/reset?token_hash=hash-123&type=recovery',
        ),
      );

      expect(token).toBe('exchanged-token');
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/auth/v1/verify'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('Given completePasswordRecovery', () => {
    it('when Supabase update password succeeds, then success response is returned', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } satisfies Partial<Response>);

      TestBed.configureTestingModule({});
      const service = TestBed.inject(WebAuthService);

      const result = await service.completePasswordRecovery({
        accessToken: 'access-token',
        newPassword: 'NouveauMotDePasse123!',
      });

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/auth/v1/user'),
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    it('when Supabase update password fails, then an explicit error is thrown', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error_description: 'Token invalide ou expiré.' }),
      } satisfies Partial<Response>);

      TestBed.configureTestingModule({});
      const service = TestBed.inject(WebAuthService);

      await expect(
        service.completePasswordRecovery({
          accessToken: 'access-token',
          newPassword: 'NouveauMotDePasse123!',
        }),
      ).rejects.toThrow('Token invalide ou expiré.');
    });
  });

  describe('Given getSession', () => {
    it('when currentSession is null, then getSession returns null without calling the API', async () => {
      TestBed.configureTestingModule({});
      const service = TestBed.inject(WebAuthService);

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
      const service = TestBed.inject(WebAuthService);

      await service.signIn({ email: 'alice@example.com', password: 'pass' });
      const ctx = await service.getSession();
      expect(ctx?.profile.appUser.email).toBe('updated@example.com');
    });

    it('when getSession returns a null profile, then persisted storage is removed', async () => {
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
        json: async () => ({ profile: null }),
      } satisfies Partial<Response>);

      TestBed.configureTestingModule({});
      const service = TestBed.inject(WebAuthService);

      await service.signIn({ email: 'alice@example.com', password: 'pass' });
      expect(localStorage.getItem(WEB_AUTH_STORAGE_KEY)).not.toBeNull();

      await service.getSession();

      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem(WEB_AUTH_STORAGE_KEY)).toBeNull();
    });
  });

  describe('Given a stored session with missing required fields', () => {
    it('when session.accessToken is missing, then the bundle is cleared and isAuthenticated is false', () => {
      localStorage.setItem(
        WEB_AUTH_STORAGE_KEY,
        JSON.stringify({
          session: { refreshToken: 'r', expiresAt: 'e', tokenType: 'bearer' },
          profile: { appUser: { id: 'user-1' }, participant: null },
        }),
      );

      TestBed.configureTestingModule({});
      const service = TestBed.inject(WebAuthService);

      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem(WEB_AUTH_STORAGE_KEY)).toBeNull();
    });

    it('when profile.appUser.id is missing, then the bundle is cleared and isAuthenticated is false', () => {
      localStorage.setItem(
        WEB_AUTH_STORAGE_KEY,
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
      const service = TestBed.inject(WebAuthService);

      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem(WEB_AUTH_STORAGE_KEY)).toBeNull();
    });
  });

  describe('Given browser storage access throws unexpectedly', () => {
    it('when localStorage getter throws in browser mode, then the service falls back to null storage', () => {
      const originalDescriptor = Object.getOwnPropertyDescriptor(
        globalThis,
        'localStorage',
      );

      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        get: () => {
          throw new Error('Storage unavailable');
        },
      });

      try {
        TestBed.configureTestingModule({
          providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
        });
        const service = TestBed.inject(WebAuthService);
        expect(service.isAuthenticated()).toBe(false);
      } finally {
        if (originalDescriptor) {
          Object.defineProperty(globalThis, 'localStorage', originalDescriptor);
        }
      }
    });
  });

  describe('Given a malformed runtime profile shape', () => {
    it('when appUser.role is missing, then currentRole safely falls back to null', () => {
      localStorage.setItem(
        WEB_AUTH_STORAGE_KEY,
        JSON.stringify({
          session: {
            accessToken: 'stored-access-token',
            refreshToken: 'stored-refresh-token',
            expiresIn: 3600,
            expiresAt: '2026-04-28T12:00:00.000Z',
            tokenType: 'bearer',
          },
          profile: {
            appUser: {
              id: 'user-1',
              email: 'alice@example.com',
            },
            participant: null,
          },
        }),
      );

      TestBed.configureTestingModule({});
      const service = TestBed.inject(WebAuthService);

      expect(service.currentRole()).toBeNull();
    });
  });
});
