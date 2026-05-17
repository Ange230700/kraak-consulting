import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import FaqPage from './faq.page';

describe('FaqPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('Given the support FAQ page When the component is created Then it should instantiate', () => {
    const fixture = TestBed.createComponent(FaqPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the support FAQ page When it renders Then it should show the page heading', () => {
    const fixture = TestBed.createComponent(FaqPage);
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent).toContain('Les r\u00e9ponses utiles');
  });

  it('Given the support FAQ page When it renders Then it should expose the KRAAK FAQ questions', () => {
    const fixture = TestBed.createComponent(FaqPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Les r\u00e9ponses utiles');
    expect(content).toContain(
      'Comment choisir le bon accompagnement chez KRAAK ?',
    );
    expect(content).toContain('Vous ne trouvez pas votre r\u00e9ponse ?');

    const contactLinks = fixture.nativeElement.querySelectorAll(
      'a[routerLink="/contact"]',
    );
    expect(contactLinks.length).toBeGreaterThan(0);

    const serviceLinks = fixture.nativeElement.querySelectorAll(
      'a[routerLink="/services"]',
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
});
