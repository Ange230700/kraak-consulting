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
    expect(heading?.textContent).toContain('potentiel');
  });

  it('should prioritize and size the hero visual assets', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const heroBadgeImage = element.querySelector(
      'img[alt="Symbole KRAAK Consulting"]',
    ) as HTMLImageElement | null;

    expect(heroBadgeImage?.getAttribute('fetchpriority')).toBe('high');
    expect(heroBadgeImage?.getAttribute('loading')).toBe('eager');
    expect(heroBadgeImage?.getAttribute('decoding')).toBe('async');
    expect(heroBadgeImage?.getAttribute('width')).toBe('48');
    expect(heroBadgeImage?.getAttribute('height')).toBe('48');
  });
});
