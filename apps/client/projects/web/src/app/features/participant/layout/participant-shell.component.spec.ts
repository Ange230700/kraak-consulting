import { ApplicationInitStatus } from '@angular/core';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WebAuthService } from '../../../core/auth/web-auth.service';
import ParticipantShell from './participant-shell.component';

import {
  KraakI18nService,
  provideKraakI18n,
} from '../../../../../../shared/i18n';
describe('ParticipantShell', () => {
  it('Given un profil absent et une route de support indisponible, When le shell calcule ses repères, Then les valeurs de repli restent utilisables', () => {
    const originalProfile = currentProfile();
    currentProfile.set(null as never);
    const page = TestBed.createComponent(ParticipantShell).componentInstance;
    vi.spyOn(
      page as unknown as { supportRoute: () => undefined },
      'supportRoute',
    ).mockReturnValue(undefined);
    expect(page['displayName']()).toBe('Participant');
    expect(page['initials']()).toBe('KR');
    expect(page['supportPath']()).toBe('/contact');
    currentProfile.set(originalProfile);
  });
  const clearSession = vi.fn();
  const currentProfile = signal({
    appUser: {
      id: 'user-1',
      email: 'ange@example.com',
      role: 'participant' as const,
      firstName: 'Ange',
      lastName: 'Kouakou',
      phone: null,
      preferredContactChannel: null,
      isActive: true,
      createdAt: '2026-08-27T00:00:00.000Z',
      updatedAt: '2026-08-27T00:00:00.000Z',
    },
    participant: null,
  });

  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');
    clearSession.mockReset();

    await TestBed.configureTestingModule({
      imports: [ParticipantShell],
      providers: [
        provideKraakI18n(),
        provideRouter([]),
        {
          provide: WebAuthService,
          useValue: {
            currentProfile,
            clearSession,
          },
        },
      ],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');
  });

  it('Given an authenticated participant, When the shell renders, Then identity and participant navigation are visible', () => {
    const fixture = TestBed.createComponent(ParticipantShell);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';
    const hrefs = Array.from(element.querySelectorAll('a')).map((anchor) =>
      anchor.getAttribute('href'),
    );

    expect(text).toContain('Ange Kouakou');
    expect(text).toContain('ange@example.com');
    expect(text).toContain('AK');
    expect(text).toContain('Tableau de bord');
    expect(text).toContain('Programmes');
    expect(text).toContain('Support');
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/participant/dashboard',
        '/participant/programmes',
        '/fr/contact',
      ]),
    );
  });

  it('Given an authenticated participant, When logout is activated, Then the local session is cleared and navigation returns to sign in', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(ParticipantShell);
    fixture.detectChanges();

    const logoutButton = fixture.nativeElement.querySelector(
      'button[aria-label="Se déconnecter"]',
    ) as HTMLButtonElement | null;

    logoutButton?.click();
    await fixture.whenStable();

    expect(clearSession).toHaveBeenCalledOnce();
    expect(navigateSpy).toHaveBeenCalledWith(['/connexion']);
  });

  it('Given English locale, when the shell renders, then participant navigation is translated', async () => {
    const i18n = TestBed.inject(KraakI18nService);
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await i18n.setLocale('en-GB');

    const fixture = TestBed.createComponent(ParticipantShell);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Participant area');
    expect(text).toContain('Dashboard');
    expect(text).toContain('Programmes');
    expect(text).toContain('Support');
  });
  it('Given English locale, when the participant support link renders, then it targets the English public contact route', async () => {
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(ParticipantShell);
    fixture.detectChanges();

    const hrefs = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('a'),
    ).map((anchor) => anchor.getAttribute('href'));

    expect(hrefs).toContain('/en/contact');
    expect(hrefs).not.toContain('/contact');
    expect(hrefs).not.toContain('/fr/contact');
  });
});
