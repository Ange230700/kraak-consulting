import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  provideRouter,
  Router,
} from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Component } from '@angular/core';
import {
  adminRoleChildGuard,
  adminRoleGuard,
  authChildGuard,
  authGuard,
  participantRoleChildGuard,
  participantRoleGuard,
} from './auth.guard';
import { WebAuthService } from './web-auth.service';

@Component({ template: '' })
class DummyComponent {}

const mockAuthService = (isAuthenticated: boolean, hasRole = false) => ({
  isAuthenticated: vi.fn(() => isAuthenticated),
  hasRole: vi.fn(() => hasRole),
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

    it('when the guard is triggered, then the user is redirected to the sign-in page', () => {
      const result = TestBed.runInInjectionContext(() =>
        authGuard(buildRoute(), buildState()),
      );

      const router = TestBed.inject(Router);
      expect(result).toEqual(router.createUrlTree(['/connexion']));
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

    it('when the child guard is triggered, then the user is redirected to the sign-in page', () => {
      const result = TestBed.runInInjectionContext(() =>
        authChildGuard(buildRoute(), buildState()),
      );

      const router = TestBed.inject(Router);
      expect(result).toEqual(router.createUrlTree(['/connexion']));
    });
  });
});

describe('participantRoleGuard (web)', () => {
  describe('Given an authenticated participant user', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          {
            provide: WebAuthService,
            useValue: mockAuthService(true, true),
          },
        ],
      });
    });

    it('when the participant role guard is triggered, then navigation is allowed', () => {
      const result = TestBed.runInInjectionContext(() =>
        participantRoleGuard(buildRoute(), buildState()),
      );

      expect(result).toBe(true);
    });
  });

  describe('Given an authenticated non-participant user', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([{ path: '', component: DummyComponent }]),
          {
            provide: WebAuthService,
            useValue: mockAuthService(true, false),
          },
        ],
      });
    });

    it('when the participant role guard is triggered, then the user is redirected to sign-in', () => {
      const result = TestBed.runInInjectionContext(() =>
        participantRoleGuard(buildRoute(), buildState()),
      );

      const router = TestBed.inject(Router);
      expect(result).toEqual(router.createUrlTree(['/connexion']));
    });
  });
});

describe('participantRoleChildGuard (web)', () => {
  it('Given an authenticated participant user, when the child role guard is triggered, then navigation is allowed', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: WebAuthService,
          useValue: mockAuthService(true, true),
        },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      participantRoleChildGuard(buildRoute(), buildState()),
    );

    expect(result).toBe(true);
  });
});

describe('adminRoleGuard (web)', () => {
  describe('Given an authenticated admin user', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          {
            provide: WebAuthService,
            useValue: mockAuthService(true, true),
          },
        ],
      });
    });

    it('when the admin role guard is triggered, then navigation is allowed', () => {
      const result = TestBed.runInInjectionContext(() =>
        adminRoleGuard(buildRoute(), buildState()),
      );

      expect(result).toBe(true);
    });
  });

  describe('Given an authenticated non-admin user', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([{ path: '', component: DummyComponent }]),
          {
            provide: WebAuthService,
            useValue: mockAuthService(true, false),
          },
        ],
      });
    });

    it('when the admin role guard is triggered, then the user is redirected to sign-in', () => {
      const result = TestBed.runInInjectionContext(() =>
        adminRoleGuard(buildRoute(), buildState()),
      );

      const router = TestBed.inject(Router);
      expect(result).toEqual(router.createUrlTree(['/connexion']));
    });
  });
});

describe('adminRoleChildGuard (web)', () => {
  it('Given an authenticated admin user, when the child admin role guard is triggered, then navigation is allowed', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: WebAuthService,
          useValue: mockAuthService(true, true),
        },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      adminRoleChildGuard(buildRoute(), buildState()),
    );

    expect(result).toBe(true);
  });
});
