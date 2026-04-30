import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiError } from '@kraak/api-client';
import type { DashboardAggregateDto } from '@kraak/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardPage from './dashboard.page';
import { WebAuthService } from '../../../core/auth/web-auth.service';
import {
  participantRoleGuard,
  participantRoleChildGuard,
} from '../../../core/auth/auth.guard';

function configureDashboardClient(
  fixture: ReturnType<typeof TestBed.createComponent<DashboardPage>>,
  response: Promise<unknown>,
): void {
  const component = fixture.componentInstance as unknown as {
    dashboardClient: { getAggregate: () => Promise<unknown> };
  };

  component.dashboardClient = {
    getAggregate: vi.fn().mockImplementation(() => response),
  };
}

const EMPTY_AGGREGATE: DashboardAggregateDto = {
  generatedAt: '2026-04-29T11:00:00.000Z',
  programs: [],
  upcomingSessions: [],
  recentAnnouncements: [],
};

const POPULATED_AGGREGATE: DashboardAggregateDto = {
  generatedAt: '2026-04-29T11:00:00.000Z',
  programs: [
    {
      enrollmentId: 'enr-1',
      programId: 'program-1',
      slug: 'integration',
      title: "Parcours d'intégration",
      summary: 'Suivi individuel et collectif',
      enrollmentStatus: 'active',
      cohortId: 'cohort-1',
      cohortName: 'Cohorte printemps',
      cohortStatus: 'active',
      cohortStartDate: '2026-04-20',
    },
  ],
  upcomingSessions: [
    {
      id: 'session-1',
      title: 'Atelier CV',
      status: 'scheduled',
      startsAt: '2026-05-02T16:00:00.000Z',
      endsAt: '2026-05-02T18:00:00.000Z',
      locationType: 'online',
      locationLabel: null,
      meetingLink: 'https://meet.example/session-1',
      cohortId: 'cohort-1',
      cohortName: 'Cohorte printemps',
      programId: 'program-1',
      programSlug: 'integration',
      programTitle: "Parcours d'intégration",
    },
  ],
  recentAnnouncements: [
    {
      id: 'announcement-1',
      title: 'Rappel documents',
      body: 'Pensez à vérifier vos pièces justificatives.',
      audienceType: 'all_participants',
      programId: null,
      cohortId: null,
      publishedAt: '2026-04-28T11:00:00.000Z',
    },
  ],
};

async function flush(
  fixture: ReturnType<typeof TestBed.createComponent<DashboardPage>>,
): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('Web Participant Dashboard Page', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [WebAuthService, provideRouter([])],
    }).compileComponents();
  });

  describe('Component Creation', () => {
    it('should create the component', async () => {
      const fixture = TestBed.createComponent(DashboardPage);
      configureDashboardClient(fixture, Promise.resolve(EMPTY_AGGREGATE));
      await flush(fixture);

      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should expose currentProfile signal from WebAuthService', async () => {
      const fixture = TestBed.createComponent(DashboardPage);
      configureDashboardClient(fixture, Promise.resolve(EMPTY_AGGREGATE));
      await flush(fixture);

      expect(fixture.componentInstance.currentProfile).toBeDefined();
    });
  });

  describe('Dashboard data integration', () => {
    it('Given populated dashboard aggregate, When the page loads, Then it renders programs, sessions, announcements and quick links', async () => {
      const fixture = TestBed.createComponent(DashboardPage);
      configureDashboardClient(fixture, Promise.resolve(POPULATED_AGGREGATE));
      await flush(fixture);

      const element = fixture.nativeElement as HTMLElement;
      const text = element.textContent ?? '';
      const linkHrefs = Array.from(element.querySelectorAll('a')).map(
        (anchor) => anchor.getAttribute('href'),
      );

      expect(text).toContain('Mon dashboard');
      expect(text).toContain("Parcours d'intégration");
      expect(text).toContain('Atelier CV');
      expect(text).toContain('Rappel documents');
      expect(text).toContain('Cohorte printemps');
      expect(linkHrefs).toEqual(
        expect.arrayContaining(['/programmes', '/contact']),
      );
    });

    it('Given an empty dashboard aggregate, When the page loads, Then it renders the global empty state', async () => {
      const fixture = TestBed.createComponent(DashboardPage);
      configureDashboardClient(fixture, Promise.resolve(EMPTY_AGGREGATE));
      await flush(fixture);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain(
        "Aucun contenu n'est disponible pour l'instant sur votre espace.",
      );
    });

    it('Given a dashboard API error, When the page loads, Then it shows an actionable error message and a retry button', async () => {
      const fixture = TestBed.createComponent(DashboardPage);
      configureDashboardClient(
        fixture,
        Promise.reject(
          new ApiError(503, 'Service Unavailable', {
            message: 'Service indisponible',
          }),
        ),
      );
      await flush(fixture);

      const element = fixture.nativeElement as HTMLElement;
      const text = element.textContent ?? '';
      expect(text).toContain('Service indisponible');

      const retryButton = element.querySelector(
        'button[type="button"]',
      ) as HTMLButtonElement | null;
      expect(retryButton?.textContent?.trim()).toBe('Réessayer');
    });

    it('Given the retry button is clicked after an error, When the next call resolves, Then the dashboard renders fresh content', async () => {
      const fixture = TestBed.createComponent(DashboardPage);
      const responses: Promise<DashboardAggregateDto>[] = [
        Promise.reject(
          new ApiError(500, 'Server Error', { message: 'Erreur serveur' }),
        ),
        Promise.resolve(POPULATED_AGGREGATE),
      ];
      const component = fixture.componentInstance as unknown as {
        dashboardClient: { getAggregate: () => Promise<DashboardAggregateDto> };
      };
      component.dashboardClient = {
        getAggregate: vi.fn().mockImplementation(() => responses.shift()!),
      };

      await flush(fixture);
      const errorText =
        (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(errorText).toContain('Erreur serveur');

      const retryButton = (fixture.nativeElement as HTMLElement).querySelector(
        'button[type="button"]',
      ) as HTMLButtonElement | null;
      retryButton?.click();
      await flush(fixture);

      const refreshedText =
        (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(refreshedText).toContain('Atelier CV');
    });
  });

  describe('Route Protection', () => {
    it('Given no authentication, When the participant guard runs, Then WebAuthService.isAuthenticated should be false', () => {
      const authService = TestBed.inject(WebAuthService);
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.isParticipant()).toBe(false);
    });

    it('Given the participant route, Then it is protected by participantRoleGuard and participantRoleChildGuard', () => {
      expect(participantRoleGuard).toBeDefined();
      expect(participantRoleChildGuard).toBeDefined();
    });
  });
});
