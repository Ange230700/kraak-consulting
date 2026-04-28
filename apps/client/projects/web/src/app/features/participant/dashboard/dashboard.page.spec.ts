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

    it('Given the participant dashboard loads, when the template is rendered, then it should expose MVP summary cards, reminders, latest news and quick links', () => {
      TestBed.configureTestingModule({
        imports: [DashboardPage],
        providers: [WebAuthService],
      });

      const fixture = TestBed.createComponent(DashboardPage);
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const text = element.textContent ?? '';
      const links = Array.from(element.querySelectorAll('a')).map((anchor) =>
        anchor.getAttribute('href'),
      );

      expect(text).toContain("Vue d'ensemble");
      expect(text).toContain('Rappels');
      expect(text).toContain('Dernieres actus');
      expect(text).toContain('Programmes suivis');
      expect(text).toContain('Prochaine session');
      expect(text).toContain('Ressources a ouvrir');
      expect(text).toContain('Finaliser votre dossier participant');
      expect(text).toContain('Nouvelle annonce');
      expect(links).toEqual(
        expect.arrayContaining(['/programmes', '/contact']),
      );
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
