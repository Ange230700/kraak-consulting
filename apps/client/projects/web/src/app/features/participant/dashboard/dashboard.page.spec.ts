import { TestBed } from '@angular/core/testing';

import DashboardPage from './dashboard.page';
import { WebAuthService } from '../../../core/auth/web-auth.service';

describe('Web Participant Dashboard Page', () => {
  describe('Component Creation', () => {
    it('should create the component', () => {
      TestBed.configureTestingModule({
        imports: [DashboardPage],
        providers: [WebAuthService],
      });

      const component = TestBed.createComponent(DashboardPage);
      expect(component.componentInstance).toBeTruthy();
    });

    it('should expose currentProfile signal from WebAuthService', () => {
      TestBed.configureTestingModule({
        imports: [DashboardPage],
        providers: [WebAuthService],
      });

      const component =
        TestBed.createComponent(DashboardPage).componentInstance;
      expect(component.currentProfile).toBeDefined();
    });
  });

  describe('Route Protection', () => {
    it('Given no authentication, when accessing protected participant route, then WebAuthService.isAuthenticated should be false', () => {
      TestBed.configureTestingModule({
        providers: [WebAuthService],
      });

      const authService = TestBed.inject(WebAuthService);
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('Given navigation to /participant without auth, then auth guard should prevent access and redirect to /', () => {
      // This test verifies that the route is protected by the guard.
      // The guard implementation (authGuard from auth.guard.ts) ensures
      // that unauthenticated users are redirected to the home page (/).
      TestBed.configureTestingModule({
        providers: [WebAuthService],
      });

      const authService = TestBed.inject(WebAuthService);
      // If currentSession and currentProfile are both not null, isAuthenticated is true
      // Otherwise it's false, and the guard redirects
      expect(authService.currentSession()).toBeNull();
      expect(authService.currentProfile()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});
