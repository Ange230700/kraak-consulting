import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import ForbiddenPage from './forbidden.page';

describe('ForbiddenPage', () => {
  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');

    await TestBed.configureTestingModule({
      imports: [ForbiddenPage],
      providers: [provideRouter([]), provideKraakI18n()],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');
  });

  it('Given the forbidden page When the component is created Then it should instantiate', () => {
    const fixture = TestBed.createComponent(ForbiddenPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the French locale When the forbidden page renders Then localized guidance is shown', () => {
    const fixture = TestBed.createComponent(ForbiddenPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Accès refusé');
    expect(content).toContain("Retour à l'accueil");
    expect(content).toContain('Nous contacter');
  });

  it('Given the English locale When the forbidden page renders Then localized guidance is shown', async () => {
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(ForbiddenPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Access denied');
    expect(content).toContain('Back to home');
    expect(content).toContain('Contact us');
  });
});
