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
  let messageService: MessageService;
  let messageServiceAddSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    authService.requestPasswordReset.mockReset();
    authService.requestPasswordReset.mockResolvedValue({
      success: true,
      message:
        "Si cette adresse existe, un email de réinitialisation vient d'être envoyé.",
    });

    await TestBed.configureTestingModule({
      imports: [PasswordResetPage],
      providers: [
        provideRouter([]),
        { provide: WebAuthService, useValue: authService },
        MessageService,
      ],
    }).compileComponents();

    messageService = TestBed.inject(MessageService);
    messageServiceAddSpy = vi.spyOn(messageService, 'add');
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
      redirectTo: resolveWebRedirectUrl('/auth/reset', environment.siteUrl),
    });
    expect(fixture.componentInstance.successMessage()).toContain('email');
    expect(messageServiceAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'app-feedback',
        severity: 'success',
        summary: 'R\u00E9initialisation',
      }),
    );
  });

  it('Given an invalid email, when submit is called, then no reset request is sent and validation is visible', async () => {
    const fixture = TestBed.createComponent(PasswordResetPage);
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'not-an-email' });

    await component.submit();
    fixture.detectChanges();

    expect(authService.requestPasswordReset).not.toHaveBeenCalled();
    expect(component.form.controls.email.touched).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent ?? '').toContain(
      'Saisissez une adresse email valide.',
    );
  });

  it('Given a submit already in progress, when submit is called again, then no additional request is sent', async () => {
    const fixture = TestBed.createComponent(PasswordResetPage);
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'alice@example.com' });
    component.submitting.set(true);

    await component.submit();

    expect(authService.requestPasswordReset).not.toHaveBeenCalled();
  });

  it('Given a backend failure, when submit is called, then an error message is exposed and submitting resets', async () => {
    authService.requestPasswordReset.mockRejectedValueOnce(new Error('boom'));
    const fixture = TestBed.createComponent(PasswordResetPage);
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'alice@example.com' });

    await component.submit();

    expect(component.errorMessage()).toContain('boom');
    expect(component.successMessage()).toBeNull();
    expect(component.submitting()).toBe(false);
  });

  it('Given submitting and feedback signals, when template is rendered, then loading label and both feedback messages are shown', () => {
    const fixture = TestBed.createComponent(PasswordResetPage);
    const component = fixture.componentInstance;
    component.submitting.set(true);
    component.successMessage.set('Email envoyé.');
    component.errorMessage.set('Erreur temporaire.');

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const submitButton = host.querySelector('button[type="submit"]');
    expect(submitButton?.getAttribute('aria-label')).toBe('Envoi en cours...');
    expect(host.textContent ?? '').toContain('Email envoyé.');
    expect(host.textContent ?? '').toContain('Erreur temporaire.');
  });
});
