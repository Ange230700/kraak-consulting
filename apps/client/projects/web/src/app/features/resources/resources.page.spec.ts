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

  it('should create', () => {
    const fixture = TestBed.createComponent(ResourcesPage);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the main heading and the three resource pillars', () => {
    const fixture = TestBed.createComponent(ResourcesPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      'Ressources pour clarifier votre prochaine étape',
    );
    expect(element.textContent).toContain('Formation');
    expect(element.textContent).toContain('Projet');
    expect(element.textContent).toContain('Immigration');
    expect(element.textContent).toContain('Entreprise');
  });
});
