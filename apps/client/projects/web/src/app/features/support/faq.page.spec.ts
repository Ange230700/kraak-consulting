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

    // Verify navigation links are present
    const contactLinks = fixture.nativeElement.querySelectorAll(
      'a[routerLink="/contact"]',
    );
    expect(contactLinks.length).toBeGreaterThan(0);

    const serviceLinks = fixture.nativeElement.querySelectorAll(
      'a[routerLink="/services"]',
    );
    expect(serviceLinks.length).toBeGreaterThan(0);
  });
});
