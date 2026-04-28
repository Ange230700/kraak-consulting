import { inject } from '@angular/core';
import {
  type CanActivateFn,
  type CanActivateChildFn,
  Router,
} from '@angular/router';
import { WebAuthService } from './web-auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(WebAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/']);
};

export const authChildGuard: CanActivateChildFn = () => {
  const authService = inject(WebAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
