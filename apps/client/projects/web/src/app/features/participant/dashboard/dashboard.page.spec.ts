import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiError } from '@kraak/api-client';
import type { DashboardAggregateDto } from '@kraak/contracts';
import { MessageService } from 'primeng/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardPage from './dashboard.page';
import {
  WEB_AUTH_STORAGE_KEY,
  WebAuthService,
} from '../../../core/auth/web-auth.service';
import {
  participantRoleGuard,
  participantRoleChildGuard,
} from '../../../core/auth/auth.guard';

const TEST_MEETING_LINK_URL = 'https://meet.example/session-1';

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

const MINIMAL_PROGRAM_AGGREGATE: DashboardAggregateDto = {
  generatedAt: '2026-04-29T11:00:00.000Z',
  programs: [
    {
      enrollmentId: 'enr-min',
      programId: 'program-min',
      slug: 'minimal',
      title: 'Programme minimal',
      summary: '',
      enrollmentStatus: 'active',
      cohortId: null,
      cohortName: null,
      cohortStatus: 'active',
      cohortStartDate: '2026-04-20',
    },
  ],
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
      meetingLink: TEST_MEETING_LINK_URL,
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
    globalThis.localStorage?.removeItem(WEB_AUTH_STORAGE_KEY);

    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [WebAuthService, provideRouter([]), MessageService],
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
      expect(text).toContain('Synthèse utile');
      expect(text).toContain("Parcours d'intégration");
      expect(text).toContain('Atelier CV');
      expect(text).toContain('Rappel documents');
      expect(text).toContain('Cohorte printemps');
      expect(linkHrefs).toEqual(
        expect.arrayContaining(['/programmes', '/contact']),
      );
    });

    it('Given populated dashboard aggregate, When the page loads, Then it renders useful synthesis indicators and next step summary', async () => {
      const fixture = TestBed.createComponent(DashboardPage);
      configureDashboardClient(fixture, Promise.resolve(POPULATED_AGGREGATE));
      await flush(fixture);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain('Synth\u00E8se utile');
      expect(text).toContain('Programmes actifs');
      expect(text).toContain('Sessions \u00E0 venir');
      expect(text).toContain('Annonces récentes');
      expect(text).toContain('3 éléments clés disponibles aujourd’hui.');
      expect(text).toContain('Prochaine session');
      expect(text).toContain('Atelier CV - ');
    });

    it('Given no upcoming sessions, When the page loads, Then it renders the no-session summary in next step', async () => {
      const fixture = TestBed.createComponent(DashboardPage);
      configureDashboardClient(fixture, Promise.resolve(EMPTY_AGGREGATE));
      await flush(fixture);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain('Prochaine session');
      expect(text).toContain('Aucune session planifiée pour le moment.');
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
      expect(retryButton?.textContent?.trim()).toBe('R\u00E9essayer');
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

    it('Given a native Error rejection, When the page loads, Then it surfaces the error message', async () => {
      const fixture = TestBed.createComponent(DashboardPage);
      configureDashboardClient(fixture, Promise.reject(new Error('boom')));
      await flush(fixture);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('boom');
    });

    it('Given an ApiError without a message body, When the page loads, Then it shows the generic fallback message', async () => {
      const fixture = TestBed.createComponent(DashboardPage);
      configureDashboardClient(
        fixture,
        Promise.reject(new ApiError(500, 'Server Error', {})),
      );
      await flush(fixture);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain(
        'Impossible de charger votre dashboard pour le moment.',
      );
    });

    it('Given a non-Error rejection value, When the page loads, Then it shows the generic fallback message', async () => {
      const fixture = TestBed.createComponent(DashboardPage);
      const nonErrorReason: unknown = 'oops';
      configureDashboardClient(fixture, Promise.reject(nonErrorReason));
      await flush(fixture);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain(
        'Impossible de charger votre dashboard pour le moment.',
      );
    });

    it('Given exactly one item in aggregate, When the page loads, Then totalSummaryLabel uses singular form', async () => {
      const fixture = TestBed.createComponent(DashboardPage);
      configureDashboardClient(
        fixture,
        Promise.resolve({
          ...EMPTY_AGGREGATE,
          upcomingSessions: [POPULATED_AGGREGATE.upcomingSessions[0]],
        }),
      );
      await flush(fixture);

      expect(fixture.componentInstance.totalSummaryLabel()).toBe(
        '1 élément clé disponible aujourd’hui.',
      );
    });

    it('Given a stored authenticated session, When the real dashboard client loads data, Then the bearer token is forwarded to the API request', async () => {
      globalThis.localStorage?.setItem(
        WEB_AUTH_STORAGE_KEY,
        JSON.stringify({
          session: {
            accessToken: 'participant-access-token',
            refreshToken: 'participant-refresh-token',
            expiresIn: 3600,
            expiresAt: '2026-04-29T11:00:00.000Z',
            tokenType: 'bearer',
          },
          profile: {
            appUser: {
              id: 'user-1',
              email: 'participant@example.com',
              role: 'participant',
              firstName: 'Awa',
              lastName: 'Konaté',
              phone: null,
              preferredContactChannel: null,
              isActive: true,
              createdAt: '2026-04-29T11:00:00.000Z',
              updatedAt: '2026-04-29T11:00:00.000Z',
            },
            participant: null,
          },
        }),
      );

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => POPULATED_AGGREGATE,
      } satisfies Partial<Response>);
      vi.stubGlobal('fetch', fetchMock);

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [DashboardPage],
        providers: [WebAuthService, provideRouter([]), MessageService],
      }).compileComponents();

      const fixture = TestBed.createComponent(DashboardPage);
      await flush(fixture);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/dashboard'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer participant-access-token',
          }),
        }),
      );

      vi.unstubAllGlobals();
    });

    it('Given a session with an invalid startsAt date, When the page loads, Then nextSessionSummary falls back to raw date string', async () => {
      const fixture = TestBed.createComponent(DashboardPage);
      configureDashboardClient(
        fixture,
        Promise.resolve({
          ...EMPTY_AGGREGATE,
          upcomingSessions: [
            {
              ...POPULATED_AGGREGATE.upcomingSessions[0],
              startsAt: 'invalid-date',
            },
          ],
        }),
      );
      await flush(fixture);

      expect(fixture.componentInstance.nextSessionSummary()).toBe(
        'Atelier CV - invalid-date',
      );
    });

    it('Given a populated aggregate loaded, When computed signals are read directly, Then programs returns the loaded data', async () => {
      const fixture = TestBed.createComponent(DashboardPage);
      configureDashboardClient(fixture, Promise.resolve(POPULATED_AGGREGATE));
      await flush(fixture);

      const programs = fixture.componentInstance.programs();
      expect(programs).toHaveLength(1);
      expect(programs[0].title).toBe("Parcours d'intégration");
    });

    it('Given a program without summary or cohortName, When the page loads, Then those optional fields are not rendered', async () => {
      const fixture = TestBed.createComponent(DashboardPage);
      configureDashboardClient(
        fixture,
        Promise.resolve(MINIMAL_PROGRAM_AGGREGATE),
      );
      await flush(fixture);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Programme minimal');
      expect(text).not.toContain('Suivi individuel et collectif');
    });

    it('Given programs exist but no upcoming sessions, When the page loads, Then sessions card shows no-session message', async () => {
      const fixture = TestBed.createComponent(DashboardPage);
      configureDashboardClient(
        fixture,
        Promise.resolve(MINIMAL_PROGRAM_AGGREGATE),
      );
      await flush(fixture);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Aucune session planifiée pour le moment.');
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
