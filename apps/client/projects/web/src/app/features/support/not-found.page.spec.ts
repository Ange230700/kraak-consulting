import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import NotFoundPage from './not-found.page';

describe('NotFoundPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('Given the not-found page When the component is created Then it should instantiate', () => {
    const fixture = TestBed.createComponent(NotFoundPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the not-found page When it renders Then it should show the 404 guidance', () => {
    const fixture = TestBed.createComponent(NotFoundPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Page introuvable');
    expect(content).toContain("Retour à l'accueil");
    expect(content).toContain('Nous contacter');
  });
});
