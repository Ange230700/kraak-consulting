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
    expect(heading?.textContent).toContain('Des solutions concr\u00E8tes');
  });

  it('should render the four consulting service families', () => {
    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Des comp\u00E9tences qui ouvrent des portes');
    expect(content).toContain(
      'Vos id\u00E9es m\u00E9ritent une structure solide',
    );
    expect(content).toContain('Votre projet international commence ici');
    expect(content).toContain(
      'Des \u00E9quipes performantes construisent des organisations solides',
    );
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
