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

  it('should create', () => {
    const fixture = TestBed.createComponent(ServicesPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the heading', () => {
    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent).toContain(
      'Des solutions adapt\u00E9es pour former, structurer et d\u00E9velopper',
    );
  });

  it('should render the four consulting service families', () => {
    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Des compétences solides pour ouvrir des portes');
    expect(content).toContain(
      'Des idées bien structurées deviennent des projets durables',
    );
    expect(content).toContain(
      'Votre projet international mérite une préparation claire et stratégique',
    );
    expect(content).toContain(
      'Des \u00E9quipes performantes construisent des organisations solides',
    );
    expect(content).toContain('Rédaction CV');
    expect(content).toContain('Identification et recrutement de talents');
    expect(content).toContain("Politiques et stratégies d'immigration");
    expect(content).toContain("Santé et culture d'entreprise");
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
