import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebAuthService } from '../../core/auth/web-auth.service';
import AuthResetPage from './auth-reset.page';

describe('Web AuthResetPage', () => {
  const authService = {
    resolveRecoveryAccessTokenFromUrl: vi.fn(),
    completePasswordRecovery: vi.fn(),
  };

  beforeEach(async () => {
    authService.resolveRecoveryAccessTokenFromUrl.mockReset();
    authService.completePasswordRecovery.mockReset();

    authService.resolveRecoveryAccessTokenFromUrl.mockResolvedValue(
      'recovery-token',
    );
    authService.completePasswordRecovery.mockResolvedValue({
      success: true,
      message: 'Mot de passe mis à jour.',
    });

    await TestBed.configureTestingModule({
      imports: [AuthResetPage],
      providers: [
        provideRouter([]),
        { provide: WebAuthService, useValue: authService },
        MessageService,
      ],
    }).compileComponents();
  });

  it('Given a valid recovery token, when ngOnInit is called, then recovery token is available for the form', async () => {
    const fixture = TestBed.createComponent(AuthResetPage);

    await fixture.componentInstance.ngOnInit();

    expect(authService.resolveRecoveryAccessTokenFromUrl).toHaveBeenCalled();
    expect(fixture.componentInstance.recoveryToken()).toBe('recovery-token');
    expect(fixture.componentInstance.errorMessage()).toBeNull();
  });

  it('Given matching passwords, when submit is called, then password recovery completion is requested', async () => {
    const fixture = TestBed.createComponent(AuthResetPage);
    await fixture.componentInstance.ngOnInit();

    fixture.componentInstance.form.setValue({
      password: 'NouveauMotDePasse123!',
      confirmPassword: 'NouveauMotDePasse123!',
    });

    await fixture.componentInstance.submit();

    expect(authService.completePasswordRecovery).toHaveBeenCalledWith({
      accessToken: 'recovery-token',
      newPassword: 'NouveauMotDePasse123!',
    });
    expect(fixture.componentInstance.successMessage()).toContain(
      'Mot de passe',
    );
  });

  it('Given mismatching passwords, when submit is called, then the request is blocked with an explicit error', async () => {
    const fixture = TestBed.createComponent(AuthResetPage);
    await fixture.componentInstance.ngOnInit();

    fixture.componentInstance.form.setValue({
      password: 'NouveauMotDePasse123!',
      confirmPassword: 'Different123!',
    });

    await fixture.componentInstance.submit();

    expect(authService.completePasswordRecovery).not.toHaveBeenCalled();
    expect(fixture.componentInstance.errorMessage()).toContain('identiques');
  });
});
