import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import ResourcesPage from './resources.page';

describe('ResourcesPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourcesPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('Given the resources page When the component is created Then the instance exists', () => {
    const fixture = TestBed.createComponent(ResourcesPage);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the resources page When it renders Then it states that the route is an orientation page and not a news hub', () => {
    const fixture = TestBed.createComponent(ResourcesPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      "Ressources d'orientation pour clarifier votre prochaine \u00e9tape",
    );
    expect(element.textContent).toContain(
      "Cette page n'est pas un hub d'actualit\u00e9s ou une biblioth\u00e8que de contenus",
    );
  });

  it('Given the resources page When it renders Then it keeps the four orientation pillars visible', () => {
    const fixture = TestBed.createComponent(ResourcesPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Formation');
    expect(element.textContent).toContain('Projet');
    expect(element.textContent).toContain('Immigration');
    expect(element.textContent).toContain('Entreprise');
  });
});
