import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import ServerErrorPage from './server-error.page';

describe('ServerErrorPage', () => {
  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');

    await TestBed.configureTestingModule({
      imports: [ServerErrorPage],
      providers: [provideRouter([]), provideKraakI18n()],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');
  });

  it('Given the servererror page When the component is created Then it should instantiate', () => {
    const fixture = TestBed.createComponent(ServerErrorPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the French locale When the servererror page renders Then localized guidance is shown', () => {
    const fixture = TestBed.createComponent(ServerErrorPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Incident technique');
    expect(content).toContain("Retour à l'accueil");
    expect(content).toContain('Signaler un problème');
  });

  it('Given the English locale When the servererror page renders Then localized guidance is shown', async () => {
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(ServerErrorPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Technical issue');
    expect(content).toContain('Back to home');
    expect(content).toContain('Report a problem');
  });
});
