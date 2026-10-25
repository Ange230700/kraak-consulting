import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParticipantProgramListItemDto } from '@kraak/contracts';

import { WebAuthService } from '../../../core/auth/web-auth.service';
import ProgramListPage from './program-list.page';
import {
  KraakI18nService,
  provideKraakI18n,
} from '../../../../../../shared/i18n';

describe('Web Participant ProgramListPage', () => {
  it('Given tous les états d’inscription et de progression, When les libellés sont demandés, Then chaque état possède sa traduction', () => {
    const page = TestBed.createComponent(ProgramListPage).componentInstance;
    const i18n = TestBed.inject(KraakI18nService);
    for (const status of [
      'pending',
      'active',
      'completed',
      'cancelled',
    ] as const) {
      expect(page['enrollmentStatusLabel'](status)).toBe(
        i18n.translate(
          `web.participant.programList.status.enrollment.${status}`,
        ),
      );
    }
    for (const [status, key] of [
      ['not_started', 'notStarted'],
      ['in_progress', 'inProgress'],
      ['completed', 'completed'],
    ] as const) {
      expect(page['progressStatusLabel'](status)).toBe(
        i18n.translate(`web.participant.programList.status.progress.${key}`),
      );
    }
    expect(page['formatDate']('invalide')).toBe('invalide');
  });

  it.each([null, {}, { accessToken: 'test-token' }])(
    'Given une session %j, When la liste est rechargée, Then la requête transmet la langue et l’authentification disponibles',
    async (session) => {
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response('[]', { status: 200 }));
      vi.spyOn(
        TestBed.inject(WebAuthService),
        'currentSession',
      ).mockReturnValue(
        session as ReturnType<WebAuthService['currentSession']>,
      );
      const page = TestBed.createComponent(ProgramListPage).componentInstance;
      await page['reloadPrograms']();
      expect(fetchMock).toHaveBeenCalledOnce();
      const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
      expect(headers.get('Accept-Language')).toBe(
        TestBed.inject(KraakI18nService).locale(),
      );
      expect(headers.get('Authorization')).toBe(
        session && 'accessToken' in session ? 'Bearer test-token' : null,
      );
      expect(page['programs']()).toEqual([]);
      fetchMock.mockRestore();
    },
  );
  const mockProgram: ParticipantProgramListItemDto = {
    enrollmentId: 'enr-1',
    enrollmentStatus: 'active',
    program: {
      id: 'prog-1',
      slug: 'programme-test',
      title: 'Programme test',
      summary: 'Un programme de test',
      description: 'Description du programme',
      status: 'published',
      visibility: 'participants',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    cohort: {
      id: 'cohort-1',
      programId: 'prog-1',
      name: 'Cohorte pilote',
      code: 'COH-001',
      status: 'active',
      startDate: '2026-01-15T09:00:00.000Z',
      endDate: null,
      capacity: 20,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    progress: {
      totalSessions: 8,
      completedSessions: 3,
      completionRate: 38,
      status: 'in_progress',
      completedSessionIds: ['session-1', 'session-2', 'session-3'],
      updatedAt: '2026-01-20T00:00:00.000Z',
    },
  };

  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');
    await TestBed.configureTestingModule({
      imports: [ProgramListPage],
      providers: [
        provideKraakI18n(),
        provideRouter([]),
        {
          provide: WebAuthService,
          useValue: {
            currentSession: () => null,
          },
        },
      ],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');
  });

  function configureClient(
    fixture: ReturnType<typeof TestBed.createComponent<ProgramListPage>>,
    result: Promise<ParticipantProgramListItemDto[]>,
  ): void {
    fixture.componentInstance['programsClient'] = {
      list: vi.fn().mockImplementation(() => result),
    };
  }

  async function render(
    result: Promise<ParticipantProgramListItemDto[]>,
  ): Promise<ReturnType<typeof TestBed.createComponent<ProgramListPage>>> {
    const fixture = TestBed.createComponent(ProgramListPage);
    configureClient(fixture, result);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('Given enrolled programs, When the page loads, Then it renders title, progress and cohort metadata', async () => {
    const fixture = await render(Promise.resolve([mockProgram]));
    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';

    expect(text).toContain('Vos parcours');
    expect(text).toContain('Programme test');
    expect(text).toContain('Un programme de test');
    expect(text).toContain('38%');
    expect(text).toContain('3/8');
    expect(text).toContain('Cohorte pilote');

    const progress = element.querySelector('[role="progressbar"]');
    expect(progress?.getAttribute('aria-valuenow')).toBe('38');
    expect(
      element.querySelector('a[href="/participant/programmes/prog-1"]'),
    ).not.toBeNull();
  });

  it('Given no enrolled programs, When the page loads, Then it renders the empty state', async () => {
    const fixture = await render(Promise.resolve([]));

    expect(fixture.nativeElement.textContent).toContain(
      "Aucun programme n'est actuellement disponible",
    );
  });

  it('Given program loading fails, When the page settles, Then it renders the resolved error and retry action', async () => {
    const fixture = await render(Promise.reject(new Error('API Error')));
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('API Error');
    expect(element.querySelector('button')?.textContent?.trim()).toContain(
      'Réessayer',
    );
  });

  it('Given a failed load, When retry succeeds, Then fresh programs are rendered', async () => {
    const fixture = TestBed.createComponent(ProgramListPage);
    const list = vi
      .fn()
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce([mockProgram]);

    fixture.componentInstance['programsClient'] = { list };
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Temporary failure');

    const retry = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    retry.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(list).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Programme test');
  });

  it('Given English locale, when enrolled programmes render, then programme list chrome is translated', async () => {
    const i18n = TestBed.inject(KraakI18nService);
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await i18n.setLocale('en-GB');

    const fixture = await render(Promise.resolve([mockProgram]));
    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';

    expect(text).toContain('Your journeys');
    expect(text).toContain('Active');
    expect(text).toContain('In progress');
    expect(text).toContain('Progress');
    expect(text).toContain('sessions completed');
    expect(text).toContain('Cohort');
    expect(text).toContain('Start');
    expect(text).toContain('Open programme');

    const progress = element.querySelector('[role="progressbar"]');
    expect(progress?.getAttribute('aria-label')).toBe(
      'Progress for Programme test',
    );
  });
});
