import { inject } from '@angular/core';
import {
  type CanActivateFn,
  type CanActivateChildFn,
  Router,
} from '@angular/router';
import { MobileAuthService } from '../../features/auth/mobile-auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(MobileAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/sign-in']);
};

export const authChildGuard: CanActivateChildFn = () => {
  const authService = inject(MobileAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/sign-in']);
};
