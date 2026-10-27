import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import UnauthorizedPage from './unauthorized.page';

describe('UnauthorizedPage', () => {
  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');

    await TestBed.configureTestingModule({
      imports: [UnauthorizedPage],
      providers: [provideRouter([]), provideKraakI18n()],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');
  });

  it('Given the unauthorized page When the component is created Then it should instantiate', () => {
    const fixture = TestBed.createComponent(UnauthorizedPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the French locale When the unauthorized page renders Then localized guidance is shown', () => {
    const fixture = TestBed.createComponent(UnauthorizedPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Authentification requise');
    expect(content).toContain('Se connecter');
    expect(content).toContain("Demander de l'aide");
  });

  it('Given the English locale When the unauthorized page renders Then localized guidance is shown', async () => {
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(UnauthorizedPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Authentication required');
    expect(content).toContain('Sign in');
    expect(content).toContain('Ask for help');
  });
});
