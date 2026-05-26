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
