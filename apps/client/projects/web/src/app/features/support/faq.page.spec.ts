import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import FaqPage from './faq.page';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';

describe('FaqPage', () => {
  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');

    await TestBed.configureTestingModule({
      imports: [FaqPage],
      providers: [provideRouter([]), provideKraakI18n()],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');
  });

  it('Given the support FAQ page When the component is created Then it should instantiate', () => {
    const fixture = TestBed.createComponent(FaqPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the support FAQ page When it renders Then it should show the page heading', () => {
    const fixture = TestBed.createComponent(FaqPage);
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent).toContain('Les réponses utiles');
  });

  it('Given the support FAQ page When it renders Then it should expose the KRAAK FAQ questions', () => {
    const fixture = TestBed.createComponent(FaqPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Les réponses utiles');
    expect(content).toContain(
      'Comment choisir le bon accompagnement chez KRAAK ?',
    );
    expect(content).toContain('Vous ne trouvez pas votre réponse ?');

    const contactLinks = fixture.nativeElement.querySelectorAll(
      'a[href="/fr/contact"]',
    );
    expect(contactLinks.length).toBeGreaterThan(0);

    const serviceLinks = fixture.nativeElement.querySelectorAll(
      'a[href="/fr/services"]',
    );
    expect(serviceLinks.length).toBeGreaterThan(0);
  });

  it('Given the support FAQ page When reading its policies Then it should expose the public SLA and the contact-data rules', () => {
    const fixture = TestBed.createComponent(FaqPage);
    const component = fixture.componentInstance as unknown as {
      faqItems: { question: string; answer: string }[];
    };

    expect(component.faqItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          question: 'Sous quel délai recevez-vous une réponse après contact ?',
          answer: expect.stringContaining('48h ouvrées'),
        }),
        expect.objectContaining({
          question: 'Comment mes données de contact sont-elles utilisées ?',
          answer: expect.stringContaining('3 ans'),
        }),
        expect.objectContaining({
          question:
            "Est-ce que KRAAK garantit l'obtention d'un visa, d'un emploi ou d'une admission ?",
          answer: expect.stringContaining('décisions finales relèvent'),
        }),
      ]),
    );
  });
  it('Given the English locale When the support FAQ page renders Then its page copy, questions and accordion defaults are localized', async () => {
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(FaqPage);
    fixture.detectChanges();

    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(content).toContain(
      'Useful answers to help you move forward with greater clarity.',
    );
    expect(content).toContain(
      'How do I choose the right KRAAK support option?',
    );
    expect(content).toContain('Frequently asked questions');
    expect(content).toContain("Can't find the answer you need?");
    expect(content).not.toContain(
      'Comment choisir le bon accompagnement chez KRAAK ?',
    );
  });
});
