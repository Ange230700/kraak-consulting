import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import {
  requireAdminAccess,
  requireAdminSession,
  requireEmployeeAccess,
  requireEmployeeSession,
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

describe('requireEmployeeAccess', () => {
  it('Given un rôle admin, When requireEmployeeAccess est appelé, Then le token est renvoyé', async () => {
    const authService = makeAuthService('admin');
    const token = await requireEmployeeAccess(
      authService,
      'Bearer admin-token',
    );
    expect(token).toBe('admin-token');
  });

  it('Given un rôle employee, When requireEmployeeAccess est appelé, Then le token est renvoyé', async () => {
    const authService = makeAuthService('employee');
    const token = await requireEmployeeAccess(
      authService,
      'Bearer employee-token',
    );
    expect(token).toBe('employee-token');
  });

  it('Given un rôle participant, When requireEmployeeAccess est appelé, Then une ForbiddenException est levée', async () => {
    const authService = makeAuthService('participant');
    await expect(
      requireEmployeeAccess(authService, 'Bearer participant-token'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given un rôle trainer, When requireEmployeeAccess est appelé, Then une ForbiddenException est levée', async () => {
    const authService = makeAuthService('trainer');
    await expect(
      requireEmployeeAccess(authService, 'Bearer trainer-token'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given un header absent, When requireEmployeeAccess est appelé, Then une UnauthorizedException est levée', async () => {
    const authService = makeAuthService('employee');
    await expect(requireEmployeeAccess(authService)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

describe('requireEmployeeSession', () => {
  it('Given un rôle admin, When requireEmployeeSession est appelé, Then la session est renvoyée', async () => {
    const authService = makeAuthService('admin');
    const result = await requireEmployeeSession(
      authService,
      'Bearer admin-token',
    );
    expect(result.accessToken).toBe('admin-token');
  });

  it('Given un rôle employee, When requireEmployeeSession est appelé, Then la session est renvoyée', async () => {
    const authService = makeAuthService('employee');
    const result = await requireEmployeeSession(
      authService,
      'Bearer employee-token',
    );
    expect(result.accessToken).toBe('employee-token');
  });

  it('Given un rôle participant, When requireEmployeeSession est appelé, Then une ForbiddenException est levée', async () => {
    const authService = makeAuthService('participant');
    await expect(
      requireEmployeeSession(authService, 'Bearer participant-token'),
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

  it('Given un rôle employee, When requireTrainerAccess est appelé, Then une ForbiddenException est levée', async () => {
    const authService = makeAuthService('employee');
    await expect(
      requireTrainerAccess(authService, 'Bearer employee-token'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given un header absent, When requireTrainerAccess est appelé, Then une UnauthorizedException est levée', async () => {
    const authService = makeAuthService('trainer');
    await expect(requireTrainerAccess(authService)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
