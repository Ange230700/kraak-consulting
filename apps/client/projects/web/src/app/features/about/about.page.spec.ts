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
      'Une structure engagée pour le capital humain et les trajectoires durables.',
    );
  });

  it('Given the about page When it renders Then it shows the mission, intervention levels and values', () => {
    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain(
      'Révéler, former et accompagner les jeunes dans leur transformation',
    );
    expect(content).toContain('Développement des compétences');
    expect(content).toContain('Structuration des projets');
    expect(content).toContain('Accès aux opportunités internationales');
    expect(content).toContain('Ouverture et connexion globale');
  });

  it('Given the about page When it renders Then it keeps the mission-first narrative without a team block', () => {
    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Une mission claire, une vision utile.');
    expect(content).toContain('Nos valeurs');
    expect(content).not.toContain("L'équipe KRAAK");
  });
});
