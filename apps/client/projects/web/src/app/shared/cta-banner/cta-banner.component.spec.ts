import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AnalyticsService } from '../../core/analytics/analytics.service';

import { CtaBanner } from './cta-banner.component';

describe('CtaBanner', () => {
  let analyticsService: Pick<AnalyticsService, 'trackEvent'>;

  beforeEach(async () => {
    analyticsService = {
      trackEvent: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CtaBanner],
      providers: [provideRouter([])],
    })
      .overrideProvider(AnalyticsService, {
        useValue: analyticsService,
      })
      .compileComponents();
  });

  it('should render a gradient surface and CTA button', () => {
    const fixture = TestBed.createComponent(CtaBanner);
    fixture.componentRef.setInput('heading', 'Parlons de votre projet');
    fixture.componentRef.setInput(
      'body',
      'Nous pouvons cadrer le prochain pas ensemble.',
    );
    fixture.componentRef.setInput('ctaLabel', 'Nous contacter');
    fixture.componentRef.setInput('ctaLink', '/contact');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.bg-linear-to-r')).toBeTruthy();
    expect(element.querySelector('.p-button')).toBeTruthy();
  });

  it('should track a conversion event when the CTA click handler is triggered', () => {
    const fixture = TestBed.createComponent(CtaBanner);
    fixture.componentRef.setInput('heading', 'Parlons de votre projet');
    fixture.componentRef.setInput('ctaLabel', 'Nous contacter');
    fixture.componentRef.setInput('ctaLink', '/contact');
    fixture.componentRef.setInput('ctaContext', 'home_hero');
    fixture.detectChanges();

    fixture.componentInstance.onCtaClick();

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'conversion_cta_click',
      {
        cta_context: 'home_hero',
        cta_label: 'Nous contacter',
        cta_link: '/contact',
      },
    );
  });

  // Given ctaLabel or ctaLink is empty
  // When the CTA click handler is triggered
  // Then no analytics event is tracked
  it('Given an empty ctaLabel, when onCtaClick is called, then no analytics event is tracked', () => {
    const fixture = TestBed.createComponent(CtaBanner);
    fixture.componentRef.setInput('ctaLabel', '');
    fixture.componentRef.setInput('ctaLink', '/contact');
    fixture.detectChanges();

    fixture.componentInstance.onCtaClick();

    expect(analyticsService.trackEvent).not.toHaveBeenCalled();
  });

  // Given ctaContext is empty
  // When the CTA click handler is triggered
  // Then the tracking payload uses 'unknown' as context
  it('Given an empty ctaContext, when onCtaClick is called, then the tracking payload uses unknown as context', () => {
    const fixture = TestBed.createComponent(CtaBanner);
    fixture.componentRef.setInput('ctaLabel', 'Nous contacter');
    fixture.componentRef.setInput('ctaLink', '/contact');
    fixture.componentRef.setInput('ctaContext', '');
    fixture.detectChanges();

    fixture.componentInstance.onCtaClick();

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'conversion_cta_click',
      {
        cta_context: 'unknown',
        cta_label: 'Nous contacter',
        cta_link: '/contact',
      },
    );
  });
});
