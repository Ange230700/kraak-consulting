import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { FaqAccordion } from './faq-accordion.component';

const SAMPLE_ITEMS = [
  {
    question: 'Qu\u2019est-ce que KRAAK ?',
    answer:
      'KRAAK est un cabinet de conseil en formation, gestion de projet et immigration.',
  },
  {
    question: 'Comment nous contacter ?',
    answer: 'Via le formulaire de contact ou par e-mail direct.',
  },
];

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';

describe('FaqAccordion', () => {
  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');

    await TestBed.configureTestingModule({
      imports: [FaqAccordion],
      providers: [provideKraakI18n()],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');
  });

  it('Given aucun item, When le composant est rendu, Then il s affiche sans erreur', () => {
    const fixture = TestBed.createComponent(FaqAccordion);
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given une liste d items, When le composant est rendu, Then chaque question est présentée', () => {
    const fixture = TestBed.createComponent(FaqAccordion);
    fixture.componentRef.setInput('items', SAMPLE_ITEMS);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Qu\u2019est-ce que KRAAK ?');
    expect(text).toContain('Comment nous contacter ?');
  });

  it('Given une liste d items, When le composant est rendu, Then chaque réponse est présente dans le DOM', () => {
    const fixture = TestBed.createComponent(FaqAccordion);
    fixture.componentRef.setInput('items', SAMPLE_ITEMS);
    fixture.detectChanges();

    const answers = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'p-accordion-content p',
    );
    expect(answers).toHaveLength(SAMPLE_ITEMS.length);
  });

  it('Given des libellés localisés, When le composant est rendu, Then le titre, la description et le texte alternatif utilisent les entrées fournies', () => {
    const fixture = TestBed.createComponent(FaqAccordion);
    fixture.componentRef.setInput('items', SAMPLE_ITEMS);
    fixture.componentRef.setInput('heading', 'Frequently asked questions');
    fixture.componentRef.setInput(
      'description',
      'Answers to common questions.',
    );
    fixture.componentRef.setInput('backgroundAlt', 'Advisory conversation');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('h2')?.textContent).toContain(
      'Frequently asked questions',
    );
    expect(host.textContent).toContain('Answers to common questions.');
    expect(host.querySelector('img')?.getAttribute('alt')).toBe(
      'Advisory conversation',
    );
  });

  it('Given une liste d items, When une question est ouverte, Then la réponse devient visible', async () => {
    const fixture = TestBed.createComponent(FaqAccordion);
    fixture.componentRef.setInput('items', SAMPLE_ITEMS);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const firstHeader = element.querySelector(
      'p-accordion-header',
    ) as HTMLElement | null;

    expect(firstHeader).toBeTruthy();

    firstHeader?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const firstContent = element.querySelector(
      'p-accordion-content',
    ) as HTMLElement | null;
    const motionElement = element.querySelector(
      'p-accordion-content p-motion',
    ) as HTMLElement | null;
    const answer = element.querySelector(
      'p-accordion-content p',
    ) as HTMLElement | null;

    expect(firstHeader?.getAttribute('aria-expanded')).toBe('true');
    expect(firstContent?.dataset['pActive']).toBe('true');
    expect(
      globalThis.getComputedStyle(motionElement as Element).visibility,
    ).toBe('visible');
    expect(answer?.textContent).toContain(
      'KRAAK est un cabinet de conseil en formation',
    );
  });
  it('Given the English locale and no explicit chrome inputs, When the accordion renders, Then its defaults are localized', async () => {
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(FaqAccordion);
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('h2')?.textContent).toContain(
      'Frequently asked questions',
    );
    expect(host.textContent).toContain(
      'Find quick answers to the most common questions',
    );
    expect(host.querySelector('img')?.getAttribute('alt')).toBe(
      'Background image for the frequently asked questions section',
    );
  });
});
