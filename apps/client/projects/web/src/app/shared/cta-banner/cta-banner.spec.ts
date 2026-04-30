import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AnalyticsService } from '../../core/analytics/analytics.service';

import { CtaBanner } from './cta-banner';

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

  it('should render a PrimeNG card surface and CTA button', () => {
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

    expect(element.querySelector('.p-card')).toBeTruthy();
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
});
