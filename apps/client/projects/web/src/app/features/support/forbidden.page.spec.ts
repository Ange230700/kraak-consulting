import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import ForbiddenPage from './forbidden.page';

describe('ForbiddenPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForbiddenPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('Given the forbidden page When the component is created Then it should instantiate', () => {
    const fixture = TestBed.createComponent(ForbiddenPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the forbidden page When it renders Then it should show the access guidance', () => {
    const fixture = TestBed.createComponent(ForbiddenPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Accès refusé');
    expect(content).toContain("Retour à l'accueil");
    expect(content).toContain('Nous contacter');
  });
});
