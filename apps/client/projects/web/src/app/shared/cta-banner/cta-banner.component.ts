import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { AnalyticsService } from '../../core/analytics/analytics.service';

@Component({
  selector: 'kraak-cta-banner',
  standalone: true,
  imports: [RouterLink, ButtonDirective],
  templateUrl: './cta-banner.component.html',
})
export class CtaBanner {
  private readonly analyticsService = inject(AnalyticsService);

  @Input({ required: true }) heading = '';
  @Input() body = '';
  @Input() ctaLabel = '';
  @Input() ctaLink = '';
  @Input() ctaContext = '';

  onCtaClick(): void {
    if (!this.ctaLabel || !this.ctaLink) {
      return;
    }

    this.analyticsService.trackEvent(
      'conversion_cta_click',
      this.buildTrackingPayload(),
    );
  }

  private buildTrackingPayload(): Record<string, string> {
    return {
      cta_context: this.ctaContext || 'unknown',
      cta_label: this.ctaLabel,
      cta_link: this.ctaLink,
    };
  }
}
