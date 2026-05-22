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

  it('Given the about page component When it is created Then the instance exists', () => {
    const fixture = TestBed.createComponent(AboutPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the about page When it renders Then it shows the page heading', () => {
    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent).toContain(
      'Une structure engag\u00e9e pour le capital humain et les trajectoires durables.',
    );
  });

  it('Given the about page When it renders Then it shows the mission, intervention levels and values', () => {
    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain(
      'R\u00e9v\u00e9ler, former et accompagner les jeunes dans leur transformation',
    );
    expect(content).toContain('D\u00e9veloppement des comp\u00e9tences');
    expect(content).toContain('Structuration des projets');
    expect(content).toContain(
      'Acc\u00e8s aux opportunit\u00e9s internationales',
    );
    expect(content).toContain('Ouverture et connexion globale');
  });

  it('Given the about page When it renders Then it shows real organizational proof instead of a generic team preview', () => {
    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('jeunes professionnels');
    expect(content).toContain('engagement citoyen');
    expect(content).toContain('Canada');
    expect(content).toContain("C\u00f4te d'Ivoire");
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
