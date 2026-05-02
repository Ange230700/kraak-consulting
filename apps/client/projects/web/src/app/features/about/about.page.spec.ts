import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import AboutPage from './about.page';

describe('AboutPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AboutPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the heading', () => {
    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent).toContain('Former. Structurer. Transformer.');
  });

  it('should render the three intervention levels and values', () => {
    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Développement des compétences');
    expect(content).toContain('Structuration des projets');
    expect(content).toContain('Accès aux opportunités internationales');
    expect(content).toContain('Ouverture internationale');
  });
});
