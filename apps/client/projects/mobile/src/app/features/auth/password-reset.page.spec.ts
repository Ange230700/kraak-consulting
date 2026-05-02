import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileAuthService } from './mobile-auth.service';
import PasswordResetPage from './password-reset.page';

describe('Mobile PasswordResetPage', () => {
  const authService = {
    requestPasswordReset: vi.fn(),
  };

  beforeEach(async () => {
    authService.requestPasswordReset.mockReset();
    authService.requestPasswordReset.mockResolvedValue({
      success: true,
      message:
        'Si cette adresse existe, un email de r\u00E9initialisation vient d\u2019\u00EAtre envoy\u00E9.',
    });

    await TestBed.configureTestingModule({
      imports: [PasswordResetPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideRouter([]),
        { provide: MobileAuthService, useValue: authService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PasswordResetPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the reset flow, when the page renders, then the email form and sign-in link are visible', () => {
    const fixture = TestBed.createComponent(PasswordResetPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('form')).toBeTruthy();
    expect(element.textContent).toContain('R\u00E9initialiser');
    expect(element.textContent).toContain('Retour \u00E0 la connexion');
  });

  it('Given a valid email, when the form is submitted, then the auth service is called and the acknowledgement is shown', async () => {
    const fixture = TestBed.createComponent(PasswordResetPage);
    fixture.componentInstance.form.setValue({
      email: '  alice@example.com  ',
    });

    await fixture.componentInstance.submit();

    expect(authService.requestPasswordReset).toHaveBeenCalledWith({
      email: 'alice@example.com',
      redirectTo: 'kraak://auth/reset',
    });
    expect(fixture.componentInstance.successMessage()).toContain(
      'email de r\u00E9initialisation',
    );
  });
});
