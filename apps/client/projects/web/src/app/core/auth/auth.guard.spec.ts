import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  provideRouter,
  Router,
} from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Component } from '@angular/core';
import { authGuard, authChildGuard } from './auth.guard';
import { WebAuthService } from './web-auth.service';

@Component({ template: '' })
class DummyComponent {}

const mockAuthService = (isAuthenticated: boolean) => ({
  isAuthenticated: vi.fn(() => isAuthenticated),
});

const buildRoute = (): ActivatedRouteSnapshot =>
  ({}) as unknown as ActivatedRouteSnapshot;

const buildState = (url = '/tableau-de-bord'): RouterStateSnapshot =>
  ({ url }) as unknown as RouterStateSnapshot;

describe('authGuard (web)', () => {
  describe('Given an authenticated user', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          {
            provide: WebAuthService,
            useValue: mockAuthService(true),
          },
        ],
      });
    });

    it('when the guard is triggered, then navigation is allowed', () => {
      const result = TestBed.runInInjectionContext(() =>
        authGuard(buildRoute(), buildState()),
      );

      expect(result).toBe(true);
    });
  });

  describe('Given an unauthenticated user', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([{ path: '', component: DummyComponent }]),
          {
            provide: WebAuthService,
            useValue: mockAuthService(false),
          },
        ],
      });
    });

    it('when the guard is triggered, then the user is redirected to the home page', () => {
      const result = TestBed.runInInjectionContext(() =>
        authGuard(buildRoute(), buildState()),
      );

      const router = TestBed.inject(Router);
      expect(result).toEqual(router.createUrlTree(['/']));
    });
  });
});

describe('authChildGuard (web)', () => {
  describe('Given an authenticated user', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          {
            provide: WebAuthService,
            useValue: mockAuthService(true),
          },
        ],
      });
    });

    it('when the child guard is triggered, then navigation is allowed', () => {
      const result = TestBed.runInInjectionContext(() =>
        authChildGuard(buildRoute(), buildState()),
      );

      expect(result).toBe(true);
    });
  });

  describe('Given an unauthenticated user', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([{ path: '', component: DummyComponent }]),
          {
            provide: WebAuthService,
            useValue: mockAuthService(false),
          },
        ],
      });
    });

    it('when the child guard is triggered, then the user is redirected to the home page', () => {
      const result = TestBed.runInInjectionContext(() =>
        authChildGuard(buildRoute(), buildState()),
      );

      const router = TestBed.inject(Router);
      expect(result).toEqual(router.createUrlTree(['/']));
    });
  });
});
