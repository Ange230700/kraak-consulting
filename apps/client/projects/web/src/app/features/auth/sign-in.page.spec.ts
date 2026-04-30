import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebAuthService } from '../../core/auth/web-auth.service';
import SignInPage from './sign-in.page';

describe('Web SignInPage', () => {
  const authService = {
    signIn: vi.fn(),
  };

  let router: Router;
  let navigateByUrlSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    authService.signIn.mockReset();
    authService.signIn.mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [
        provideRouter([]),
        { provide: WebAuthService, useValue: authService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateByUrlSpy = vi
      .spyOn(router, 'navigateByUrl')
      .mockResolvedValue(true);
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
    expect(element.textContent).toContain('Creer un compte');
    expect(element.textContent).toContain('Mot de passe oublie');
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
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/participant/dashboard');
  });
});
