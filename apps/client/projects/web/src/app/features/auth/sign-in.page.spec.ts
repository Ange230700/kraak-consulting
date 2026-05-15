import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebAuthService } from '../../core/auth/web-auth.service';
import SignInPage from './sign-in.page';

describe('Web SignInPage', () => {
  const authService = {
    signIn: vi.fn(),
  };

  let router: Router;
  let navigateByUrlSpy: ReturnType<typeof vi.spyOn>;
  let messageService: MessageService;
  let messageServiceAddSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    authService.signIn.mockReset();
    authService.signIn.mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [SignInPage],
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
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      return undefined;
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SignInPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the web auth flow, when the page renders, then the login form and auth links are visible', () => {
    const fixture = TestBed.createComponent(SignInPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('form')).toBeTruthy();
    expect(element.textContent).toContain('Connexion');
    expect(element.textContent).toContain('Cr\u00E9er un compte');
    expect(element.textContent).toContain('Mot de passe oubli\u00E9');
  });

  it('Given valid credentials, when the form is submitted, then the auth service is called and the app navigates to the participant dashboard', async () => {
    const fixture = TestBed.createComponent(SignInPage);
    fixture.componentInstance.form.setValue({
      email: '  alice@example.com  ',
      password: 'motdepasse-securise',
    });

    await fixture.componentInstance.submit();

    expect(authService.signIn).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'motdepasse-securise',
    });
    expect(messageServiceAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'app-feedback',
        severity: 'success',
        summary: 'Connexion',
      }),
    );
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/participant/dashboard');
  });

  // Given an invalid form
  // When submit is called
  // Then the auth service is not called and the function returns early
  it('Given an invalid form, when submit is called, then the auth service is not called', async () => {
    const fixture = TestBed.createComponent(SignInPage);
    fixture.componentInstance.form.setValue({ email: '', password: '' });

    await fixture.componentInstance.submit();

    expect(authService.signIn).not.toHaveBeenCalled();
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  // Given signIn throws an error
  // When submit is called with valid credentials
  // Then the error message is set
  it('Given signIn throws an error, when submit is called, then the error message is set', async () => {
    authService.signIn.mockRejectedValue(new Error('Erreur réseau'));

    const fixture = TestBed.createComponent(SignInPage);
    fixture.componentInstance.form.setValue({
      email: 'alice@example.com',
      password: 'motdepasse-securise',
    });

    await fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(fixture.componentInstance.errorMessage()).not.toBeNull();
    expect(fixture.componentInstance.submitting()).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  // Given a valid form and signIn is in progress
  // When the template is rendered while submitting
  // Then the button label shows the in-progress text
  it('Given signIn is in progress, when the template is rendered, then the button shows the in-progress label', () => {
    let resolveSignIn!: () => void;
    authService.signIn.mockReturnValue(
      new Promise<void>((res) => {
        resolveSignIn = res;
      }),
    );

    const fixture = TestBed.createComponent(SignInPage);
    fixture.componentInstance.form.setValue({
      email: 'alice@example.com',
      password: 'motdepasse-securise',
    });

    void fixture.componentInstance.submit();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(fixture.componentInstance.submitting()).toBe(true);
    expect(button.textContent).toContain('Connexion en cours');

    resolveSignIn();
  });
});
