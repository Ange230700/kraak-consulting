import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { WebAuthService } from '../../core/auth/web-auth.service';
import PasswordResetPage from './password-reset.page';
import { resolveWebRedirectUrl } from './auth-form.utils';

describe('Web PasswordResetPage', () => {
  const authService = {
    requestPasswordReset: vi.fn(),
  };

  beforeEach(async () => {
    authService.requestPasswordReset.mockReset();
    authService.requestPasswordReset.mockResolvedValue({
      success: true,
      message:
        'Si cette adresse existe, un email de reinitialisation vient d etre envoye.',
    });

    await TestBed.configureTestingModule({
      imports: [PasswordResetPage],
      providers: [
        provideRouter([]),
        { provide: WebAuthService, useValue: authService },
        MessageService,
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PasswordResetPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given a valid email, when the form is submitted, then the reset request is sent and a success message is displayed', async () => {
    const fixture = TestBed.createComponent(PasswordResetPage);
    fixture.componentInstance.form.setValue({
      email: '  alice@example.com  ',
    });

    await fixture.componentInstance.submit();

    expect(authService.requestPasswordReset).toHaveBeenCalledWith({
      email: 'alice@example.com',
      redirectTo: resolveWebRedirectUrl(
        '/mot-de-passe-oublie',
        environment.siteUrl,
      ),
    });
    expect(fixture.componentInstance.successMessage()).toContain('email');
  });
});
