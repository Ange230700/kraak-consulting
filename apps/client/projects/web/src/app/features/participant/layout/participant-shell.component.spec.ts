import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WebAuthService } from '../../../core/auth/web-auth.service';
import ParticipantShell from './participant-shell.component';

describe('ParticipantShell', () => {
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
    clearSession.mockReset();

    await TestBed.configureTestingModule({
      imports: [ParticipantShell],
      providers: [
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
        '/contact',
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
});
