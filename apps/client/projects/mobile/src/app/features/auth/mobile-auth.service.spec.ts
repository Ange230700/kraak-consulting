import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileAuthService } from './mobile-auth.service';

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
});
