import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import UnauthorizedPage from './unauthorized.page';

describe('UnauthorizedPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnauthorizedPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('Given the unauthorized page When the component is created Then it should instantiate', () => {
    const fixture = TestBed.createComponent(UnauthorizedPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the unauthorized page When it renders Then it should show the authentication guidance', () => {
    const fixture = TestBed.createComponent(UnauthorizedPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Authentification requise');
    expect(content).toContain('Se connecter');
    expect(content).toContain("Demander de l'aide");
  });
});
