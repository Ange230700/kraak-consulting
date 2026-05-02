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
    expect(heading?.textContent).toContain('Des solutions concrètes');
  });

  it('should render the four consulting service families', () => {
    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Des compétences qui ouvrent des portes');
    expect(content).toContain('Vos idées méritent une structure solide');
    expect(content).toContain('Votre projet international commence ici');
    expect(content).toContain(
      'Des équipes performantes construisent des organisations solides',
    );
  });
});
