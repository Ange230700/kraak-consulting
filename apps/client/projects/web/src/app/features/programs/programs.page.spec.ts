import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import ProgramsPage from './programs.page';

describe('ProgramsPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramsPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('Given the Programs page route, when the component initializes, then the page instance is created', () => {
    const fixture = TestBed.createComponent(ProgramsPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the Programs page, when the view is rendered, then the heading and key program cards are visible', () => {
    const fixture = TestBed.createComponent(ProgramsPage);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain(
      "Orientation d'abord, format adapt\u00e9 ensuite.",
    );
    expect(page.textContent).toContain(
      "Ateliers d'employabilité et de posture professionnelle",
    );
    expect(page.textContent).toContain(
      'Préparation linguistique et tests de langue',
    );
    expect(page.textContent).toContain(
      'Orientation études, travail et mobilité internationale',
    );
    expect(page.textContent).toContain(
      'Interventions collectives pour écoles, associations et entreprises',
    );
  });

  it('Given the registration process section, when the Programs page is rendered, then the four expected steps are displayed in order', () => {
    const fixture = TestBed.createComponent(ProgramsPage);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;

    const content = page.textContent ?? '';
    const candidatureIndex = content.indexOf('Demande de contact');
    const entretienIndex = content.indexOf("Entretien d'orientation");
    const inscriptionIndex = content.indexOf('Proposition de format');
    const demarrageIndex = content.indexOf('Confirmation');

    expect(candidatureIndex).toBeGreaterThan(-1);
    expect(entretienIndex).toBeGreaterThan(candidatureIndex);
    expect(inscriptionIndex).toBeGreaterThan(entretienIndex);
    expect(demarrageIndex).toBeGreaterThan(inscriptionIndex);
  });

  it('Given the Programs page CTA, when a visitor reaches the end of the page, then the registration call-to-action points to contact', () => {
    const fixture = TestBed.createComponent(ProgramsPage);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;

    const registrationLink = page.querySelector(
      'a[href="/fr/contact"]',
    ) as HTMLAnchorElement | null;

    expect(registrationLink).toBeTruthy();
    expect(registrationLink?.textContent).toContain('Demander une orientation');
  });
});
