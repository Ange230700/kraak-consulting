import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebAuthService } from '../../core/auth/web-auth.service';
import AuthResetPage from './auth-reset.page';

const flushPromises = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

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

    fixture.componentInstance.ngOnInit();
    await flushPromises();

    expect(authService.resolveRecoveryAccessTokenFromUrl).toHaveBeenCalled();
    expect(fixture.componentInstance.recoveryToken()).toBe('recovery-token');
    expect(fixture.componentInstance.errorMessage()).toBeNull();
  });

  it('Given matching passwords, when submit is called, then password recovery completion is requested', async () => {
    const fixture = TestBed.createComponent(AuthResetPage);
    fixture.componentInstance.ngOnInit();
    await flushPromises();

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
    fixture.componentInstance.ngOnInit();
    await flushPromises();

    fixture.componentInstance.form.setValue({
      password: 'NouveauMotDePasse123!',
      confirmPassword: 'Different123!',
    });

    await fixture.componentInstance.submit();

    expect(authService.completePasswordRecovery).not.toHaveBeenCalled();
    expect(fixture.componentInstance.errorMessage()).toContain('identiques');
  });

  it('Given a submit is already in progress, when submit is called, then recovery completion is not requested again', async () => {
    const fixture = TestBed.createComponent(AuthResetPage);
    fixture.componentInstance.ngOnInit();
    await flushPromises();

    fixture.componentInstance.form.setValue({
      password: 'NouveauMotDePasse123!',
      confirmPassword: 'NouveauMotDePasse123!',
    });
    fixture.componentInstance.submitting.set(true);

    await fixture.componentInstance.submit();

    expect(authService.completePasswordRecovery).not.toHaveBeenCalled();
  });

  it('Given no recovery token in URL, when ngOnInit is called, then an invalid-link error is shown and tokenReady is true', async () => {
    authService.resolveRecoveryAccessTokenFromUrl.mockResolvedValueOnce(null);
    const fixture = TestBed.createComponent(AuthResetPage);

    fixture.componentInstance.ngOnInit();
    await flushPromises();

    expect(fixture.componentInstance.recoveryToken()).toBeNull();
    expect(fixture.componentInstance.errorMessage()).toContain('invalide');
    expect(fixture.componentInstance.tokenReady()).toBe(true);
  });

  it('Given token resolution fails, when ngOnInit is called, then initialization error is exposed and tokenReady is true', async () => {
    authService.resolveRecoveryAccessTokenFromUrl.mockRejectedValueOnce(
      new Error('init failed'),
    );
    const fixture = TestBed.createComponent(AuthResetPage);

    fixture.componentInstance.ngOnInit();
    await flushPromises();

    expect(fixture.componentInstance.errorMessage()).toContain('init failed');
    expect(fixture.componentInstance.tokenReady()).toBe(true);
  });

  it('Given no recovery token, when submit is called with valid passwords, then completion is blocked with an invalid-link error', async () => {
    authService.resolveRecoveryAccessTokenFromUrl.mockResolvedValueOnce(null);
    const fixture = TestBed.createComponent(AuthResetPage);
    fixture.componentInstance.ngOnInit();
    await flushPromises();

    fixture.componentInstance.form.setValue({
      password: 'NouveauMotDePasse123!',
      confirmPassword: 'NouveauMotDePasse123!',
    });

    await fixture.componentInstance.submit();

    expect(authService.completePasswordRecovery).not.toHaveBeenCalled();
    expect(fixture.componentInstance.errorMessage()).toContain('invalide');
  });

  it('Given token loading in progress, when template is rendered, then the loading information message is displayed', () => {
    const fixture = TestBed.createComponent(AuthResetPage);
    const component = fixture.componentInstance;
    component.tokenReady.set(false);

    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent ?? '').toContain(
      'Vérification du lien de réinitialisation...',
    );
  });

  it('Given form controls are touched and invalid, when template is rendered, then validation messages and disabled submit button are visible', async () => {
    authService.resolveRecoveryAccessTokenFromUrl.mockResolvedValueOnce(null);
    const fixture = TestBed.createComponent(AuthResetPage);
    fixture.componentInstance.ngOnInit();
    await flushPromises();

    fixture.componentInstance.form.markAllAsTouched();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent ?? '';
    const submitButton = host.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(text).toContain(
      'Votre mot de passe doit contenir au moins 8 caractères.',
    );
    expect(text).toContain('La confirmation du mot de passe est requise.');
    expect(submitButton.disabled).toBe(true);
  });

  it('Given URL contains recovery fragments, when ngOnInit runs, then sensitive params and hash are removed from browser history', async () => {
    const replaceStateSpy = vi.spyOn(globalThis.history, 'replaceState');
    globalThis.history.pushState(
      {},
      '',
      '/auth/reset?access_token=a&refresh_token=b&type=recovery#frag',
    );

    const fixture = TestBed.createComponent(AuthResetPage);
    fixture.componentInstance.ngOnInit();
    await flushPromises();

    expect(replaceStateSpy).toHaveBeenCalled();
    const [, , nextUrl] = replaceStateSpy.mock.calls.at(-1) ?? [];
    expect(String(nextUrl)).not.toContain('access_token=');
    expect(String(nextUrl)).not.toContain('refresh_token=');
    expect(String(nextUrl)).not.toContain('#');
  });

  it('Given password update fails, when submit is called, then an error message is exposed and submitting is reset', async () => {
    authService.completePasswordRecovery.mockRejectedValueOnce(
      new Error('reset failed'),
    );
    const fixture = TestBed.createComponent(AuthResetPage);
    fixture.componentInstance.ngOnInit();
    await flushPromises();

    fixture.componentInstance.form.setValue({
      password: 'NouveauMotDePasse123!',
      confirmPassword: 'NouveauMotDePasse123!',
    });

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toContain('reset failed');
    expect(fixture.componentInstance.submitting()).toBe(false);
  });

  it('Given recovery token disappears after submit starts, when submit continues, then invalid-link error is returned from the second token guard', async () => {
    const fixture = TestBed.createComponent(AuthResetPage);
    fixture.componentInstance.ngOnInit();
    await flushPromises();

    const component = fixture.componentInstance;

    let callCount = 0;
    Object.defineProperty(component, 'recoveryToken', {
      configurable: true,
      value: vi.fn(() => {
        callCount += 1;
        return callCount === 1 ? 'recovery-token' : null;
      }),
    });

    component.form.setValue({
      password: 'NouveauMotDePasse123!',
      confirmPassword: 'NouveauMotDePasse123!',
    });

    await component.submit();

    expect(component.errorMessage()).toContain('invalide');
    expect(authService.completePasswordRecovery).not.toHaveBeenCalled();
    expect(component.submitting()).toBe(false);
  });

  it('Given browser window is unavailable, when initialization clears sensitive fragments, then it exits without rewriting history', async () => {
    const replaceStateSpy = vi.spyOn(globalThis.history, 'replaceState');
    const windowGetterSpy = vi
      .spyOn(globalThis, 'window', 'get')
      .mockImplementation(
        () => undefined as unknown as Window & typeof globalThis,
      );
    const callsBefore = replaceStateSpy.mock.calls.length;

    try {
      const fixture = TestBed.createComponent(AuthResetPage);
      fixture.componentInstance.ngOnInit();
      await flushPromises();

      expect(replaceStateSpy.mock.calls.length).toBe(callsBefore);
    } finally {
      windowGetterSpy.mockRestore();
    }
  });

  it('Given submit state changes, when template is rendered, then button label and aria-label follow submitting state', async () => {
    const fixture = TestBed.createComponent(AuthResetPage);
    fixture.componentInstance.ngOnInit();
    await flushPromises();

    fixture.detectChanges();

    const getSubmitButton = () =>
      (fixture.nativeElement as HTMLElement).querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement;

    expect(getSubmitButton().getAttribute('aria-label')).toBe(
      'Mettre à jour le mot de passe',
    );

    fixture.componentInstance.submitting.set(true);
    fixture.detectChanges();

    expect(getSubmitButton().getAttribute('aria-label')).toBe(
      'Mise à jour en cours...',
    );
  });
});
