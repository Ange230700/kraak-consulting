import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { AnnouncementDto } from '@kraak/contracts';
import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';
import AnnouncementListPage from './announcement-list.page';

function configureAnnouncementsClient(
  fixture: ReturnType<typeof TestBed.createComponent<AnnouncementListPage>>,
  response: Promise<unknown>,
): void {
  const component = fixture.componentInstance as unknown as {
    announcementsClient: { list: () => Promise<unknown> };
  };

  component.announcementsClient = {
    list: vi.fn().mockImplementation(() => response),
  };
}

describe('Mobile AnnouncementListPage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();

    await TestBed.configureTestingModule({
      imports: [AnnouncementListPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AnnouncementListPage);
    configureAnnouncementsClient(
      fixture,
      Promise.resolve({ data: [], total: 0 }),
    );

    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given API announcements, when page loads, then it renders the feed and entry point to detail', async () => {
    const fixture = TestBed.createComponent(AnnouncementListPage);
    const announcements: AnnouncementDto[] = [
      {
        id: 'ann-001',
        title: 'Mise a jour importante',
        body: 'Nouvelle information utile pour tous les participants.',
        priority: 'high',
        audienceType: 'all_participants',
        programId: null,
        cohortId: null,
        status: 'published',
        publishedAt: '2026-04-29T10:00:00.000Z',
        createdByUserId: 'user-1',
        createdAt: '2026-04-29T09:30:00.000Z',
        updatedAt: '2026-04-29T09:45:00.000Z',
      },
    ];

    configureAnnouncementsClient(
      fixture,
      Promise.resolve({ data: announcements, total: announcements.length }),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const title = fixture.nativeElement.querySelector('ion-title');

    expect(title?.textContent).toContain('Annonces');
    expect(element.textContent).toContain('Mise a jour importante');
    expect(element.textContent).toContain(
      'Nouvelle information utile pour tous les participants.',
    );

    expect(element.textContent).toContain('Lire le détail');
  });

  it('Given an API error, when page loads, then it shows an actionable error state', async () => {
    const fixture = TestBed.createComponent(AnnouncementListPage);
    configureAnnouncementsClient(
      fixture,
      Promise.reject(new Error('Erreur annonces test')),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Erreur annonces test');
    expect(element.textContent).toContain('Recharger le flux');
  });
});
