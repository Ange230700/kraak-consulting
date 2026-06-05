import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileAuthService } from './mobile-auth.service';
import SignUpPage from './sign-up.page';

describe('Mobile SignUpPage', () => {
  const authService = {
    signUp: vi.fn(),
  };

  beforeEach(async () => {
    authService.signUp.mockReset();
    authService.signUp.mockResolvedValue({
      message:
        'Votre compte a été créé. Vérifiez votre email pour confirmer votre accès.',
      requiresEmailConfirmation: true,
      session: null,
      profile: null,
    });

    await TestBed.configureTestingModule({
      imports: [SignUpPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideRouter([]),
        { provide: MobileAuthService, useValue: authService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SignUpPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given a participant signup flow, when the page renders, then the signup form and sign-in link are visible', () => {
    const fixture = TestBed.createComponent(SignUpPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('form')).toBeTruthy();
    expect(element.textContent).toContain('Créer un compte');
    expect(element.textContent).toContain('Se connecter');
  });

  it('Given untouched valid defaults, when the page renders, then the generic form validation warning is not shown', () => {
    const fixture = TestBed.createComponent(SignUpPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).not.toContain(
      'Vérifiez vos informations avant de continuer.',
    );
  });

  it('Given a signup submission in progress, when the page renders, then the loading button label is shown', () => {
    const fixture = TestBed.createComponent(SignUpPage);
    fixture.componentInstance.submitting.set(true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Création en cours...');
  });

  it('Given valid participant data, when the form is submitted, then the auth service is called and a success message is exposed', async () => {
    const fixture = TestBed.createComponent(SignUpPage);
    fixture.componentInstance.form.setValue({
      firstName: '  Alice  ',
      lastName: '  Dupont  ',
      email: '  alice@example.com  ',
      password: 'motdepasse-securise',
      phone: '  +2250700000000  ',
    });

    await fixture.componentInstance.submit();

    expect(authService.signUp).toHaveBeenCalledWith({
      firstName: 'Alice',
      lastName: 'Dupont',
      email: 'alice@example.com',
      password: 'motdepasse-securise',
      phone: '+2250700000000',
      preferredContactChannel: null,
      redirectTo: 'kraak://auth/callback',
    });
    expect(fixture.componentInstance.successMessage()).toContain(
      'Vérifiez votre email',
    );
  });

  it('Given an empty form, when submit is called, then auth service is not called and the form error is rendered', async () => {
    const fixture = TestBed.createComponent(SignUpPage);
    fixture.detectChanges();

    await fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(authService.signUp).not.toHaveBeenCalled();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain(
      'Vérifiez vos informations avant de continuer.',
    );
  });

  it('Given signUp throws an error, when submit is called, then the error message is rendered', async () => {
    authService.signUp.mockRejectedValue(new Error('Compte déjà existant'));
    const fixture = TestBed.createComponent(SignUpPage);
    fixture.componentInstance.form.setValue({
      firstName: 'Alice',
      lastName: 'Dupont',
      email: 'alice@example.com',
      password: 'motdepasse-securise',
      phone: '',
    });

    await fixture.componentInstance.submit();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Compte déjà existant');
  });

  it('Given signUp returns a session and profile, when submit succeeds, then router navigates to accueil', async () => {
    authService.signUp.mockResolvedValue({
      session: { accessToken: 'tok' },
      profile: { appUser: { id: '1' } },
      message: '',
      requiresEmailConfirmation: false,
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi
      .spyOn(router, 'navigateByUrl')
      .mockResolvedValue(true);

    const fixture = TestBed.createComponent(SignUpPage);
    fixture.componentInstance.form.setValue({
      firstName: 'Alice',
      lastName: 'Dupont',
      email: 'alice@example.com',
      password: 'motdepasse-securise',
      phone: '',
    });

    await fixture.componentInstance.submit();

    expect(navigateSpy).toHaveBeenCalledWith('/tabs/accueil');
  });

  it('Given an empty phone field, when submit is called, then signUp receives phone as null', async () => {
    const fixture = TestBed.createComponent(SignUpPage);
    fixture.componentInstance.form.setValue({
      firstName: 'Alice',
      lastName: 'Dupont',
      email: 'alice@example.com',
      password: 'motdepasse-securise',
      phone: '',
    });

    await fixture.componentInstance.submit();

    expect(authService.signUp).toHaveBeenCalledWith(
      expect.objectContaining({ phone: null }),
    );
  });

  it('Given valid data, when submit succeeds, then the success message is rendered in the template', async () => {
    const fixture = TestBed.createComponent(SignUpPage);
    fixture.componentInstance.form.setValue({
      firstName: 'Alice',
      lastName: 'Dupont',
      email: 'alice@example.com',
      password: 'motdepasse-securise',
      phone: '',
    });

    await fixture.componentInstance.submit();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Vérifiez votre email');
  });
});
