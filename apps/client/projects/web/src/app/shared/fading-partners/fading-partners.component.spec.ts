import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { FadingPartners } from './fading-partners.component';

describe('FadingPartners', () => {
  let component: FadingPartners;
  let fixture: ComponentFixture<FadingPartners>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FadingPartners],
    }).compileComponents();

    fixture = TestBed.createComponent(FadingPartners);
    component = fixture.componentInstance;
  });

  const renderComponent = (): void => {
    fixture.detectChanges();
  };

  it('Given the component is created When Angular instantiates it Then the instance should exist', () => {
    expect(component).toBeTruthy();
  });

  it('Given duplicated partners When the component renders Then it should display every partner item', () => {
    renderComponent();

    const partnerElements = fixture.nativeElement.querySelectorAll('.px-10');
    expect(partnerElements.length).toBe(component.duplicatedPartners.length);
  });

  it('Given duplicated partners When the component renders Then it should display the partner names', () => {
    renderComponent();

    const partnerNames = fixture.nativeElement.querySelectorAll(
      '[class*="text-neutral-700"][class*="font-semibold"]',
    );
    expect(partnerNames.length).toBeGreaterThan(0);
  });

  it('Given the scrolling strip When the component renders Then it should expose both fade gradients', () => {
    renderComponent();

    const fadeGradients = fixture.nativeElement.querySelectorAll(
      '[class*="fade-gradient"]',
    );
    expect(fadeGradients.length).toBe(2);
  });

  it('Given the raw partner catalog When the component is initialized Then it should expose the expected partner count', () => {
    expect(component.partners.length).toBe(5);
  });

  it('Given the infinite scroll behaviour When the component is initialized Then it should duplicate the partner list once', () => {
    expect(component.duplicatedPartners.length).toBe(10);
  });

  describe('Rendering', () => {
    it('Given the section wrapper When the component renders Then it should keep the neutral background styling', () => {
      renderComponent();

      const section = fixture.nativeElement.querySelector('section');
      expect(section).toBeTruthy();
      expect(section.classList.contains('bg-neutral-50')).toBe(true);
    });

    it('Given the marquee container When the component renders Then it should keep the animation class', () => {
      renderComponent();

      const scrollContainer = fixture.nativeElement.querySelector(
        '[class*="animate-scroll"]',
      );
      expect(scrollContainer).toBeTruthy();
    });

    it('Given hardcoded SVG logos When the component renders Then each duplicated partner should keep an SVG node', () => {
      renderComponent();

      const renderedLogos = fixture.nativeElement.querySelectorAll(
        '[aria-hidden="true"] svg',
      );
      expect(renderedLogos.length).toBe(component.duplicatedPartners.length);
    });

    it('Given structured SVG logos When the component renders Then it should keep every expected SVG path', () => {
      renderComponent();

      const renderedPaths = fixture.nativeElement.querySelectorAll(
        '[aria-hidden="true"] path',
      );
      const expectedPathCount = component.duplicatedPartners.reduce(
        (total, partner) => total + partner.logo.paths.length,
        0,
      );

      expect(renderedPaths.length).toBe(expectedPathCount);
    });

    it('Given the logo containers When the component renders Then it should keep one container per duplicated partner', () => {
      renderComponent();

      const logoContainers = fixture.nativeElement.querySelectorAll(
        '[aria-hidden="true"]',
      );
      expect(logoContainers.length).toBe(component.duplicatedPartners.length);
    });
  });
});
