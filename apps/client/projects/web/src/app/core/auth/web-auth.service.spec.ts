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
});
