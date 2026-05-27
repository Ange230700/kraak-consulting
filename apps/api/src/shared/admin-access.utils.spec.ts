import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import {
  requireAdminAccess,
  requireAdminSession,
  requireEmployeAccess,
  requireEmployeSession,
  requireTrainerAccess,
} from './admin-access.utils';

function makeAuthService(role: string) {
  return {
    getSession: jest.fn().mockResolvedValue({
      profile: {
        appUser: { role },
      },
    }),
  };
}

describe('requireAdminSession', () => {
  it('Given un token admin valide, When requireAdminSession est appelé, Then la session est renvoyée', async () => {
    const authService = makeAuthService('admin');
    const result = await requireAdminSession(authService, 'Bearer admin-token');
    expect(result.accessToken).toBe('admin-token');
  });

  it('Given un rôle participant, When requireAdminSession est appelé, Then une ForbiddenException est levée', async () => {
    const authService = makeAuthService('participant');
    await expect(
      requireAdminSession(authService, 'Bearer participant-token'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given un header absent, When requireAdminSession est appelé, Then une UnauthorizedException est levée', async () => {
    const authService = makeAuthService('admin');
    await expect(requireAdminSession(authService)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

describe('requireAdminAccess', () => {
  it('Given un token admin valide, When requireAdminAccess est appelé, Then le token est renvoyé', async () => {
    const authService = makeAuthService('admin');
    const token = await requireAdminAccess(authService, 'Bearer admin-token');
    expect(token).toBe('admin-token');
  });
});

describe('requireEmployeAccess', () => {
  it('Given un rôle admin, When requireEmployeAccess est appelé, Then le token est renvoyé', async () => {
    const authService = makeAuthService('admin');
    const token = await requireEmployeAccess(authService, 'Bearer admin-token');
    expect(token).toBe('admin-token');
  });

  it('Given un rôle employe, When requireEmployeAccess est appelé, Then le token est renvoyé', async () => {
    const authService = makeAuthService('employe');
    const token = await requireEmployeAccess(
      authService,
      'Bearer employe-token',
    );
    expect(token).toBe('employe-token');
  });

  it('Given un rôle participant, When requireEmployeAccess est appelé, Then une ForbiddenException est levée', async () => {
    const authService = makeAuthService('participant');
    await expect(
      requireEmployeAccess(authService, 'Bearer participant-token'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given un rôle trainer, When requireEmployeAccess est appelé, Then une ForbiddenException est levée', async () => {
    const authService = makeAuthService('trainer');
    await expect(
      requireEmployeAccess(authService, 'Bearer trainer-token'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given un header absent, When requireEmployeAccess est appelé, Then une UnauthorizedException est levée', async () => {
    const authService = makeAuthService('employe');
    await expect(requireEmployeAccess(authService)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

describe('requireEmployeSession', () => {
  it('Given un rôle admin, When requireEmployeSession est appelé, Then la session est renvoyée', async () => {
    const authService = makeAuthService('admin');
    const result = await requireEmployeSession(
      authService,
      'Bearer admin-token',
    );
    expect(result.accessToken).toBe('admin-token');
  });

  it('Given un rôle employe, When requireEmployeSession est appelé, Then la session est renvoyée', async () => {
    const authService = makeAuthService('employe');
    const result = await requireEmployeSession(
      authService,
      'Bearer employe-token',
    );
    expect(result.accessToken).toBe('employe-token');
  });

  it('Given un rôle participant, When requireEmployeSession est appelé, Then une ForbiddenException est levée', async () => {
    const authService = makeAuthService('participant');
    await expect(
      requireEmployeSession(authService, 'Bearer participant-token'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('requireTrainerAccess', () => {
  it('Given un rôle admin, When requireTrainerAccess est appelé, Then le token est renvoyé', async () => {
    const authService = makeAuthService('admin');
    const token = await requireTrainerAccess(authService, 'Bearer admin-token');
    expect(token).toBe('admin-token');
  });

  it('Given un rôle trainer, When requireTrainerAccess est appelé, Then le token est renvoyé', async () => {
    const authService = makeAuthService('trainer');
    const token = await requireTrainerAccess(
      authService,
      'Bearer trainer-token',
    );
    expect(token).toBe('trainer-token');
  });

  it('Given un rôle participant, When requireTrainerAccess est appelé, Then une ForbiddenException est levée', async () => {
    const authService = makeAuthService('participant');
    await expect(
      requireTrainerAccess(authService, 'Bearer participant-token'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given un rôle employe, When requireTrainerAccess est appelé, Then une ForbiddenException est levée', async () => {
    const authService = makeAuthService('employe');
    await expect(
      requireTrainerAccess(authService, 'Bearer employe-token'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given un header absent, When requireTrainerAccess est appelé, Then une UnauthorizedException est levée', async () => {
    const authService = makeAuthService('trainer');
    await expect(requireTrainerAccess(authService)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
