import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import HomePage from './home.page';

describe('HomePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HomePage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the welcome heading', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent).toContain('trajectoire');
  });

  it('should render a newsletter email input in the hero', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const emailInput = element.querySelector(
      'input[type="email"][aria-label="Votre adresse email"]',
    ) as HTMLInputElement | null;

    expect(emailInput).toBeTruthy();
    expect(emailInput?.placeholder).toBe('Votre adresse email');
  });

  it('should expose a dark hero background style object', () => {
    const fixture = TestBed.createComponent(HomePage);
    const component = fixture.componentInstance;

    expect(component.heroBackgroundStyle.background).toContain(
      'bw-hero-bg.jpg',
    );
    expect(component.heroBackgroundStyle.backgroundBlendMode).toBe(
      'normal, multiply, normal',
    );
  });
});
