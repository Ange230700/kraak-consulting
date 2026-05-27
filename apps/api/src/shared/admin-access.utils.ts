import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { AuthService } from '../auth/auth.service';
import { extractAccessToken } from '../auth/auth.dto';

type AdminSession = Awaited<
  ReturnType<Pick<AuthService, 'getSession'>['getSession']>
>;

export async function requireAdminSession(
  authService: Pick<AuthService, 'getSession'>,
  authorizationHeader?: string,
): Promise<{ accessToken: string; session: AdminSession }> {
  const accessToken = extractAccessToken(authorizationHeader);

  if (!accessToken.valid) {
    throw new UnauthorizedException({
      success: false,
      message: accessToken.error,
    });
  }

  const session = await authService.getSession(accessToken.data);

  if (session.profile.appUser.role !== 'admin') {
    throw new ForbiddenException({
      success: false,
      message: 'Accès admin requis.',
    });
  }

  return {
    accessToken: accessToken.data,
    session,
  };
}

export async function requireAdminAccess(
  authService: Pick<AuthService, 'getSession'>,
  authorizationHeader?: string,
): Promise<string> {
  const { accessToken } = await requireAdminSession(
    authService,
    authorizationHeader,
  );
  return accessToken;
}

// Allows admin OR employe — for support inbox, enrollment management
export async function requireEmployeSession(
  authService: Pick<AuthService, 'getSession'>,
  authorizationHeader?: string,
): Promise<{ accessToken: string; session: AdminSession }> {
  const accessToken = extractAccessToken(authorizationHeader);

  if (!accessToken.valid) {
    throw new UnauthorizedException({
      success: false,
      message: accessToken.error,
    });
  }

  const session = await authService.getSession(accessToken.data);
  // `employe` can be persisted by auth metadata before contracts expose it in the role union.
  const role = session.profile.appUser.role as string;

  if (role !== 'admin' && role !== 'employe') {
    throw new ForbiddenException({
      success: false,
      message: 'Accès réservé aux employés et administrateurs.',
    });
  }

  return {
    accessToken: accessToken.data,
    session,
  };
}

export async function requireEmployeAccess(
  authService: Pick<AuthService, 'getSession'>,
  authorizationHeader?: string,
): Promise<string> {
  const { accessToken } = await requireEmployeSession(
    authService,
    authorizationHeader,
  );
  return accessToken;
}

// Allows admin OR trainer — for session/cohort read operations
export async function requireTrainerAccess(
  authService: Pick<AuthService, 'getSession'>,
  authorizationHeader?: string,
): Promise<string> {
  const accessToken = extractAccessToken(authorizationHeader);

  if (!accessToken.valid) {
    throw new UnauthorizedException({
      success: false,
      message: accessToken.error,
    });
  }

  const session = await authService.getSession(accessToken.data);
  const role = session.profile.appUser.role;

  if (role !== 'admin' && role !== 'trainer') {
    throw new ForbiddenException({
      success: false,
      message: 'Accès réservé aux formateurs et administrateurs.',
    });
  }

  return accessToken.data;
}
