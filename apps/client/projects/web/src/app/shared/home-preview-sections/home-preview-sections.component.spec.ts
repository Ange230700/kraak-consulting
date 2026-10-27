import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import { HomePreviewSections } from './home-preview-sections.component';

describe('HomePreviewSections', () => {
  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');

    await TestBed.configureTestingModule({
      imports: [HomePreviewSections],
      providers: [provideKraakI18n()],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');
  });

  it('Given the non-production preview wrapper When it renders Then it exposes all home preview blocks', () => {
    const fixture = TestBed.createComponent(HomePreviewSections);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Partenaires et clients de confiance');
    expect(content).toContain('Chiffres d’impact en prévisualisation');
    expect(content).toContain('Témoignages');
    expect(content).toContain(
      'Ils ne cherchaient pas juste une solution. Ils voulaient un résultat.',
    );
    expect(content).toContain(
      'Un espace est réservé aux témoignages clients en cours de validation.',
    );
    expect(content).toContain('Prévisualisation du format témoignages');
  });

  it('Given the English locale When the home preview renders Then testimonial preview chrome is localized', async () => {
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(HomePreviewSections);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Testimonials');
    expect(content).toContain(
      'They were not just looking for a solution. They wanted a result.',
    );
    expect(content).toContain(
      'This space is reserved for client testimonials currently being validated.',
    );

    expect(content).not.toContain('Ils ne cherchaient pas juste une solution.');
    expect(content).not.toContain(
      'Un espace est réservé aux témoignages clients',
    );
  });
});
