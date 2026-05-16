import { Directive, HostListener, Input, inject } from '@angular/core';

import { AnalyticsService } from '../../core/analytics/analytics.service';

export type PublicConversionPayload = Record<string, string | number | boolean>;

@Directive({
  selector: '[kraakPublicConversion]',
  standalone: true,
})
export class PublicConversionTrackingDirective {
  private readonly analyticsService = inject(AnalyticsService);

  @Input('kraakPublicConversion') eventName = '';
  @Input() kraakPublicConversionPayload: PublicConversionPayload = {};

  @HostListener('click')
  trackClick(): void {
    const trimmedEventName = this.eventName.trim();

    if (!trimmedEventName) {
      return;
    }

    this.analyticsService.trackEvent(
      trimmedEventName,
      this.kraakPublicConversionPayload,
    );
  }
}
