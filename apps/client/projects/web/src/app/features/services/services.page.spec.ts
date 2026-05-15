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
      'Des solutions adapt\u00e9es pour former, structurer et d\u00e9velopper',
    );
  });

  it('Given the services page When it renders Then the four consulting service families are visible', () => {
    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain(
      'Des comp\u00e9tences solides pour ouvrir des portes',
    );
    expect(content).toContain(
      'Des id\u00e9es bien structur\u00e9es deviennent des projets durables',
    );
    expect(content).toContain(
      'Votre projet international m\u00e9rite une pr\u00e9paration claire et strat\u00e9gique',
    );
    expect(content).toContain(
      'Des \u00e9quipes performantes construisent des organisations solides',
    );
    expect(content).toContain('R\u00e9daction CV');
    expect(content).toContain('Identification et recrutement de talents');
    expect(content).toContain("Politiques et strat\u00e9gies d'immigration");
    expect(content).toContain("Sant\u00e9 et culture d'entreprise");
  });

  it('Given the services page When it renders Then it does not duplicate the dedicated FAQ route content', () => {
    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const faqAccordion = element.querySelector('kraak-faq-accordion');

    expect(faqAccordion).toBeNull();
    expect(element.textContent).not.toContain('Questions fr\u00e9quentes');
  });
});
