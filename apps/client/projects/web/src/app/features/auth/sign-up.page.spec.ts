// apps\client\projects\web\src\app\features\auth\sign-up.page.spec.ts

import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { WebAuthService } from '../../core/auth/web-auth.service';
import SignUpPage from './sign-up.page';
import { resolveWebRedirectUrl } from './auth-form.utils';

describe('Web SignUpPage', () => {
  const authService = {
    signUp: vi.fn(),
  };

  let router: Router;
  let navigateByUrlSpy: ReturnType<typeof vi.spyOn>;
  let messageService: MessageService;
  let messageServiceAddSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    authService.signUp.mockReset();
    authService.signUp.mockResolvedValue({
      message: 'Votre compte a été créé.',
      requiresEmailConfirmation: true,
      session: null,
      profile: null,
    });

    await TestBed.configureTestingModule({
      imports: [SignUpPage],
      providers: [
        provideRouter([]),
        { provide: WebAuthService, useValue: authService },
        MessageService,
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    messageService = TestBed.inject(MessageService);
    navigateByUrlSpy = vi
      .spyOn(router, 'navigateByUrl')
      .mockResolvedValue(true);
    messageServiceAddSpy = vi.spyOn(messageService, 'add');
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SignUpPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given valid signup data, when the form is submitted, then the auth service receives normalized values', async () => {
    const fixture = TestBed.createComponent(SignUpPage);
    fixture.componentInstance.form.setValue({
      firstName: '  Alice  ',
      lastName: '  Dupont  ',
      email: '  alice@example.com  ',
      password: 'motdepasse-securise',
    });

    await fixture.componentInstance.submit();

    expect(authService.signUp).toHaveBeenCalledWith({
      firstName: 'Alice',
      lastName: 'Dupont',
      email: 'alice@example.com',
      password: 'motdepasse-securise',
      redirectTo: resolveWebRedirectUrl('/connexion', environment.siteUrl),
    });
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.successMessage()).toBe(
      'Votre compte a été créé.',
    );
    expect(messageServiceAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'app-feedback',
        severity: 'success',
        summary: 'Inscription',
      }),
    );
    expect(messageServiceAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'app-feedback',
        severity: 'success',
        summary: 'Inscription',
      }),
    );
  });

  it('Given a signup response with an active session, when submit resolves, then the app navigates to the participant dashboard', async () => {
    authService.signUp.mockResolvedValueOnce({
      message: 'Bienvenue',
      requiresEmailConfirmation: false,
      session: {
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 3600,
        expiresAt: '2026-05-01T12:00:00.000Z',
        tokenType: 'bearer',
      },
      profile: {
        appUser: {
          id: 'user-1',
          email: 'alice@example.com',
          role: 'participant',
          firstName: 'Alice',
          lastName: 'Dupont',
          phone: null,
          preferredContactChannel: null,
          isActive: true,
          createdAt: '2026-05-01T12:00:00.000Z',
          updatedAt: '2026-05-01T12:00:00.000Z',
        },
        participant: null,
      },
    });

    const fixture = TestBed.createComponent(SignUpPage);
    fixture.componentInstance.form.setValue({
      firstName: 'Alice',
      lastName: 'Dupont',
      email: 'alice@example.com',
      password: 'motdepasse-securise',
    });

    await fixture.componentInstance.submit();

    expect(navigateByUrlSpy).toHaveBeenCalledWith('/participant/dashboard');
  });

  // Given an invalid form
  // When submit is called
  // Then the auth service is not called
  it('Given an invalid form, when submit is called, then the auth service is not called', async () => {
    const fixture = TestBed.createComponent(SignUpPage);
    fixture.componentInstance.form.setValue({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    });

    await fixture.componentInstance.submit();

    expect(authService.signUp).not.toHaveBeenCalled();
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  // Given signUp throws an error
  // When submit is called with valid data
  // Then the error message is set
  it('Given signUp throws an error, when submit is called, then the error message is set', async () => {
    authService.signUp.mockRejectedValue(new Error('Erreur réseau'));

    const fixture = TestBed.createComponent(SignUpPage);
    fixture.componentInstance.form.setValue({
      firstName: 'Alice',
      lastName: 'Dupont',
      email: 'alice@example.com',
      password: 'motdepasse-securise',
    });

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).not.toBeNull();
    expect(fixture.componentInstance.submitting()).toBe(false);
  });

  it('Given firstName and lastName are touched and invalid, when template renders, then name validation message is displayed', () => {
    const fixture = TestBed.createComponent(SignUpPage);
    const component = fixture.componentInstance;

    component.form.controls.firstName.markAsTouched();
    component.form.controls.lastName.markAsTouched();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent ?? '').toContain(
      'Renseignez votre prénom et votre nom.',
    );
  });

  it('Given email is touched and invalid, when template renders, then email validation message is displayed', () => {
    const fixture = TestBed.createComponent(SignUpPage);
    const component = fixture.componentInstance;

    component.form.controls.email.markAsTouched();
    component.form.controls.email.setValue('invalide');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent ?? '').toContain(
      'Saisissez une adresse email valide.',
    );
  });

  it('Given password is touched and invalid, when template renders, then password validation message is displayed', () => {
    const fixture = TestBed.createComponent(SignUpPage);
    const component = fixture.componentInstance;

    component.form.controls.password.markAsTouched();
    component.form.controls.password.setValue('123');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent ?? '').toContain(
      'Le mot de passe doit contenir au moins 8 caractères.',
    );
  });

  it('Given success and error feedback are present, when template renders, then both messages are visible', () => {
    const fixture = TestBed.createComponent(SignUpPage);
    const component = fixture.componentInstance;
    component.successMessage.set('Compte créé.');
    component.errorMessage.set('Erreur temporaire.');

    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Compte créé.');
    expect(text).toContain('Erreur temporaire.');
  });

  it('Given submitting state toggles, when template renders, then submit button label and disabled state follow submitting signal', () => {
    const fixture = TestBed.createComponent(SignUpPage);
    const component = fixture.componentInstance;

    component.submitting.set(false);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const button = host.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Créer mon compte');
    expect(button.disabled).toBe(false);

    component.submitting.set(true);
    fixture.detectChanges();
    expect(button.getAttribute('aria-label')).toBe('Création en cours...');
    expect(button.disabled).toBe(true);
  });
});
