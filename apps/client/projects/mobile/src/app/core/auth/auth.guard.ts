import { inject } from '@angular/core';
import {
  type CanActivateFn,
  type CanActivateChildFn,
  Router,
} from '@angular/router';
import type { UserRoleValue } from '@kraak/contracts';
import { MobileAuthService } from '../../features/auth/mobile-auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(MobileAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/sign-in']);
};

export const authChildGuard: CanActivateChildFn = authGuard;

function canAccessRole(
  authService: MobileAuthService,
  router: Router,
  ...roles: UserRoleValue[]
): true | ReturnType<Router['createUrlTree']> {
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/sign-in']);
  }

  if (authService.hasRole(...roles)) {
    return true;
  }

  return router.createUrlTree(['/sign-in']);
}

export const participantRoleGuard: CanActivateFn = () => {
  const authService = inject(MobileAuthService);
  const router = inject(Router);

  return canAccessRole(authService, router, 'participant');
};

export const participantRoleChildGuard: CanActivateChildFn =
  participantRoleGuard;

export const adminRoleGuard: CanActivateFn = () => {
  const authService = inject(MobileAuthService);
  const router = inject(Router);

  return canAccessRole(authService, router, 'admin');
};

export const adminRoleChildGuard: CanActivateChildFn = adminRoleGuard;
