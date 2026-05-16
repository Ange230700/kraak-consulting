import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import ServerErrorPage from './server-error.page';

describe('ServerErrorPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServerErrorPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('Given the server-error page When the component is created Then it should instantiate', () => {
    const fixture = TestBed.createComponent(ServerErrorPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the server-error page When it renders Then it should show the outage guidance', () => {
    const fixture = TestBed.createComponent(ServerErrorPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Incident technique');
    expect(content).toContain("Retour à l'accueil");
    expect(content).toContain('Signaler un problème');
  });
});
