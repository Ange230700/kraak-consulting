import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import ServicesPage from './services.page';

describe('ServicesPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('Given the services page When the component is created Then the instance exists', () => {
    const fixture = TestBed.createComponent(ServicesPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the services page When it renders Then the page heading is visible', () => {
    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent).toContain(
      'Des offres claires pour renforcer les parcours, les projets et les organisations',
    );
  });

  it('Given the services page When it renders Then the four consulting service families are visible', () => {
    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('KRAAK Training Centre');
    expect(content).toContain("Centre de Recherche et d'Innovation");
    expect(content).toContain('Centre de Conseils en Immigration');
    expect(content).toContain('Offres entreprises');
    expect(content).toContain('Pour qui');
    expect(content).toContain('Ce que nous livrons');
    expect(content).toContain('Prochaine \u00e9tape');
  });

  it('Given the services page When it renders Then it does not duplicate the dedicated FAQ route content', () => {
    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const faqAccordion = element.querySelector('kraak-faq-accordion');

    expect(faqAccordion).toBeNull();
    expect(element.textContent).not.toContain('Questions fr\u00e9quentes');
  });

  it('should render service-specific FAQ section', () => {
    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Questions fr\u00E9quentes');
    expect(content).toContain(
      'Comment choisir le service le plus adapt\u00E9 \u00E0 mon objectif ?',
    );
  });
});
