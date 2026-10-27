import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import NotFoundPage from './not-found.page';

describe('NotFoundPage', () => {
  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');

    await TestBed.configureTestingModule({
      imports: [NotFoundPage],
      providers: [provideRouter([]), provideKraakI18n()],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');
  });

  it('Given the notfound page When the component is created Then it should instantiate', () => {
    const fixture = TestBed.createComponent(NotFoundPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the French locale When the notfound page renders Then localized guidance is shown', () => {
    const fixture = TestBed.createComponent(NotFoundPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Page introuvable');
    expect(content).toContain("Retour à l'accueil");
    expect(content).toContain('Demander une orientation');
  });

  it('Given the English locale When the notfound page renders Then localized guidance is shown', async () => {
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(NotFoundPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Page not found');
    expect(content).toContain('Back to home');
    expect(content).toContain('Ask for guidance');
  });
});
