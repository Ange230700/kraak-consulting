import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { AnalyticsService } from '../../core/analytics/analytics.service';
import { PublicConversionTrackingDirective } from './public-conversion-tracking.directive';

@Component({
  standalone: true,
  imports: [PublicConversionTrackingDirective],
  template: `
    <button
      [kraakPublicConversion]="eventName"
      [kraakPublicConversionPayload]="payload"
    >
      CTA
    </button>
  `,
})
class HostComponent {
  eventName = 'cta_clicked';
  payload = {
    placement: 'hero',
    authenticated: false,
  };
}

describe('PublicConversionTrackingDirective', () => {
  const analyticsServiceMock = {
    trackEvent: vi.fn(),
  } satisfies Pick<AnalyticsService, 'trackEvent'>;

  beforeEach(async () => {
    analyticsServiceMock.trackEvent.mockReset();

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        {
          provide: AnalyticsService,
          useValue: analyticsServiceMock,
        },
      ],
    }).compileComponents();
  });

  it('Given a configured public conversion CTA When the host button is clicked Then the analytics event is tracked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement | null;

    expect(button).not.toBeNull();
    button?.click();

    expect(analyticsServiceMock.trackEvent).toHaveBeenCalledWith(
      'cta_clicked',
      {
        placement: 'hero',
        authenticated: false,
      },
    );
  });

  it('Given an empty event name When the host button is clicked Then no analytics event is tracked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.eventName = '   ';
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement | null;

    expect(button).not.toBeNull();
    button?.click();

    expect(analyticsServiceMock.trackEvent).not.toHaveBeenCalled();
  });
});
