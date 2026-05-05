import { TestBed } from '@angular/core/testing';

import { FaqAccordion } from './faq-accordion';

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

describe('FaqAccordion', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqAccordion],
    }).compileComponents();
  });

  it('Given aucun item, When le composant est rendu, Then il s affiche sans erreur', () => {
    const fixture = TestBed.createComponent(FaqAccordion);
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given une liste d items, When le composant est rendu, Then chaque question est présente', () => {
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
    expect(answers.length).toBe(SAMPLE_ITEMS.length);
  });
});
