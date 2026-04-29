import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiError } from '@kraak/api-client';
import HomePage from './home.page';
import { describe, it, beforeEach, expect, vi } from 'vitest';

function configureDashboardClient(
  fixture: ReturnType<typeof TestBed.createComponent<HomePage>>,
  response: Promise<unknown>,
): void {
  const component = fixture.componentInstance as unknown as {
    dashboardClient: { getAggregate: () => Promise<unknown> };
  };

  component.dashboardClient = {
    getAggregate: vi.fn().mockImplementation(() => response),
  };
}

describe('Mobile HomePage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();

    await TestBed.configureTestingModule({
      imports: [HomePage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', async () => {
    const fixture = TestBed.createComponent(HomePage);
    configureDashboardClient(
      fixture,
      Promise.resolve({
        generatedAt: '2026-04-29T11:00:00.000Z',
        programs: [],
        upcomingSessions: [],
        recentAnnouncements: [],
      }),
    );

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the title', async () => {
    const fixture = TestBed.createComponent(HomePage);
    configureDashboardClient(
      fixture,
      Promise.resolve({
        generatedAt: '2026-04-29T11:00:00.000Z',
        programs: [],
        upcomingSessions: [],
        recentAnnouncements: [],
      }),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('ion-title');
    expect(title?.textContent).toContain('Votre espace KRAAK');
  });

  it('should render a branded hero with action buttons and a quick link', async () => {
    const fixture = TestBed.createComponent(HomePage);
    configureDashboardClient(
      fixture,
      Promise.resolve({
        generatedAt: '2026-04-29T11:00:00.000Z',
        programs: [],
        upcomingSessions: [],
        recentAnnouncements: [],
      }),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const brandImage = element.querySelector(
      'img[alt="Logo KRAAK Consulting"]',
    ) as HTMLImageElement | null;
    const actions = element.querySelectorAll('ion-button');

    expect(brandImage?.getAttribute('src')).toContain(
      'kraak_consulting_logo_192w.png',
    );
    expect(actions.length).toBe(2);
    expect(element.textContent).toContain('Voir les ressources utiles');
  });

  it('Given dashboard aggregate data, when the page loads, then it renders programs, sessions and announcements', async () => {
    const fixture = TestBed.createComponent(HomePage);
    configureDashboardClient(
      fixture,
      Promise.resolve({
        generatedAt: '2026-04-29T11:00:00.000Z',
        programs: [
          {
            enrollmentId: 'enr-1',
            programId: 'program-1',
            slug: 'integration',
            title: "Parcours d'integration",
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
            programTitle: "Parcours d'integration",
          },
        ],
        recentAnnouncements: [
          {
            id: 'announcement-1',
            title: 'Rappel documents',
            body: 'Pensez a verifier vos pieces justificatives.',
            audienceType: 'all_participants',
            programId: null,
            cohortId: null,
            publishedAt: '2026-04-28T11:00:00.000Z',
          },
        ],
      }),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Mon dashboard');
    expect(text).toContain("Parcours d'integration");
    expect(text).toContain('Atelier CV');
    expect(text).toContain('Rappel documents');

    const element = fixture.nativeElement as HTMLElement;
    const links = element.querySelectorAll('a');

    expect(links.length).toBeGreaterThan(0);
    expect(element.textContent).toContain('Voir tout');
  });

  it('Given an empty dashboard aggregate, when the page loads, then it renders a global empty state', async () => {
    const fixture = TestBed.createComponent(HomePage);
    configureDashboardClient(
      fixture,
      Promise.resolve({
        generatedAt: '2026-04-29T11:00:00.000Z',
        programs: [],
        upcomingSessions: [],
        recentAnnouncements: [],
      }),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(
      "Aucun contenu n'est disponible pour l'instant sur votre espace.",
    );
  });

  it('Given a dashboard API error, when the page loads, then it shows an actionable error message', async () => {
    const fixture = TestBed.createComponent(HomePage);
    configureDashboardClient(
      fixture,
      Promise.reject(
        new ApiError(503, 'Service Unavailable', {
          message: 'Service indisponible',
        }),
      ),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Service indisponible');
    expect(text).toContain('Réessayer');
  });
});
