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
      'Former des leaders conscients de leur valeur et capables de créer un impact durable.',
    );
  });

  it('Given the about page When it renders Then it shows the mission, intervention levels and values', () => {
    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain(
      'Révéler, former et accompagner les jeunes dans leur transformation',
    );
    expect(content).toContain('D\u00E9veloppement des comp\u00E9tences');
    expect(content).toContain('Structuration des projets');
    expect(content).toContain(
      'Acc\u00E8s aux opportunit\u00E9s internationales',
    );
    expect(content).toContain('Ouverture et connexion globale');
  });

  it('Given the local web build When the about page renders Then it keeps the team preview section visible for review', () => {
    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain("Pr\u00E9visualisation de l'\u00E9quipe KRAAK");
    expect(content).toContain("L'\u00E9quipe KRAAK");
    expect(content).toContain('Savannah Nguyen');
  });
});
