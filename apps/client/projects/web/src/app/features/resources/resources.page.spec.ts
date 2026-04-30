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
      'Ressources utiles pour avancer avec méthode',
    );
    expect(element.textContent).toContain('Formation');
    expect(element.textContent).toContain('Gestion de projet');
    expect(element.textContent).toContain('International');
  });
});
