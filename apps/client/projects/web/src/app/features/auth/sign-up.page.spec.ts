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
      message: 'Votre compte a ete cree.',
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
      'Votre compte a ete cree.',
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
});
