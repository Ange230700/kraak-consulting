import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileAuthService } from './mobile-auth.service';
import SignInPage from './sign-in.page';

describe('Mobile SignInPage', () => {
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
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideRouter([]),
        { provide: MobileAuthService, useValue: authService },
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

  it('Given the mobile auth flow, when the page renders, then the login form and auth links are visible', () => {
    const fixture = TestBed.createComponent(SignInPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('form')).toBeTruthy();
    expect(element.textContent).toContain('Se connecter');
    expect(element.textContent).toContain('Cr\u00E9er un compte');
    expect(element.textContent).toContain('Mot de passe oubli\u00E9');
  });

  it('Given valid credentials, when the form is submitted, then the auth service is called and the app navigates to the shell', async () => {
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
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/tabs/accueil');
  });
});
