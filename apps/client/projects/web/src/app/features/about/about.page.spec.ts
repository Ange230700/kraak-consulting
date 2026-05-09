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

    expect(content).toContain('D\u00E9veloppement des comp\u00E9tences');
    expect(content).toContain('Structuration des projets');
    expect(content).toContain(
      'Acc\u00E8s aux opportunit\u00E9s internationales',
    );
    expect(content).toContain('Ouverture internationale');
  });

  it('should render the team preview section', () => {
    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain("Pr\u00E9visualisation de l'\u00E9quipe KRAAK");
    expect(content).toContain("L'\u00E9quipe KRAAK");
    expect(content).toContain('Savannah Nguyen');
  });
});
