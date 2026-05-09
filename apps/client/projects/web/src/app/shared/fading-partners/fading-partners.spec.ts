import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FadingPartners } from './fading-partners';

describe('FadingPartners', () => {
  let component: FadingPartners;
  let fixture: ComponentFixture<FadingPartners>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FadingPartners],
    }).compileComponents();

    fixture = TestBed.createComponent(FadingPartners);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all partners', () => {
    const partnerElements = fixture.nativeElement.querySelectorAll('.px-10');
    // Should have duplicated partners for infinite scroll
    expect(partnerElements.length).toBe(component.duplicatedPartners.length);
  });

  it('should display partner names', () => {
    const partnerNames = fixture.nativeElement.querySelectorAll(
      '[class*="text-neutral-700"][class*="font-semibold"]',
    );
    expect(partnerNames.length).toBeGreaterThan(0);
  });

  it('should have fade gradients', () => {
    const fadeGradients = fixture.nativeElement.querySelectorAll(
      '[class*="fade-gradient"]',
    );
    expect(fadeGradients.length).toBe(2); // left and right
  });

  it('should have correct partner count', () => {
    expect(component.partners.length).toBe(5);
  });

  it('should duplicate partners for infinite scroll', () => {
    expect(component.duplicatedPartners.length).toBe(10); // 5 * 2
  });

  describe('Rendering', () => {
    it('should render section with correct classes', () => {
      const section = fixture.nativeElement.querySelector('section');
      expect(section).toBeTruthy();
      expect(section.classList.contains('bg-neutral-50')).toBe(true);
    });

    it('should have animation class on scroll container', () => {
      const scrollContainer = fixture.nativeElement.querySelector(
        '[class*="animate-scroll"]',
      );
      expect(scrollContainer).toBeTruthy();
    });

    it('should render partner logos', () => {
      const logoContainers = fixture.nativeElement.querySelectorAll(
        '[aria-hidden="true"]',
      );
      expect(logoContainers.length).toBe(component.duplicatedPartners.length);
    });
  });
});
