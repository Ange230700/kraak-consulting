import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileSupportService } from './mobile-support.service';
import SupportPage from './support.page';

describe('Mobile SupportPage', () => {
  const supportService = {
    listMyRequests: vi.fn(),
  };

  beforeEach(async () => {
    supportService.listMyRequests.mockReset();
    supportService.listMyRequests.mockResolvedValue([]);

    await TestBed.configureTestingModule({
      imports: [SupportPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideRouter([]),
        { provide: MobileSupportService, useValue: supportService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SupportPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the title', () => {
    const fixture = TestBed.createComponent(SupportPage);
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('ion-title');
    expect(title?.textContent).toContain('Support');
  });

  it('Given support requests exist, when page initializes, then it shows tracked status labels', async () => {
    supportService.listMyRequests.mockResolvedValue([
      {
        id: 'req-1',
        userId: 'user-1',
        participantId: 'participant-1',
        subject: 'Connexion impossible',
        message: 'Je ne peux plus acc\u00E9der \u00E0 mon espace.',
        status: 'in_progress',
        category: 'technical',
        assignedToUserId: null,
        createdAt: '2026-04-29T10:00:00.000Z',
        updatedAt: '2026-04-29T10:10:00.000Z',
      },
    ]);

    const fixture = TestBed.createComponent(SupportPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Suivi de vos demandes');
    expect(element.textContent).toContain('Connexion impossible');
    expect(element.textContent).toContain('En cours');
  });
});
