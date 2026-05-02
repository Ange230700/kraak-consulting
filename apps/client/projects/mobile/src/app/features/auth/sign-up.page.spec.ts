import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
        'Votre compte a \u00E9t\u00E9 cr\u00E9\u00E9. V\u00E9rifiez votre email pour confirmer votre acc\u00E8s.',
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
    expect(element.textContent).toContain('Cr\u00E9er un compte');
    expect(element.textContent).toContain('Se connecter');
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
      'V\u00E9rifiez votre email',
    );
  });
});
