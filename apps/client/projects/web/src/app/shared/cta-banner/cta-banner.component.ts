import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { SOURCE_LOCALE } from '@kraak/domain';

import { AnalyticsService } from '../../core/analytics/analytics.service';
import {
  findLocalizedPublicRouteEntryByLegacyPath,
  resolveLocaleFromPublicPath,
} from '../../routing/localized-public-routes';

@Component({
  selector: 'kraak-cta-banner',
  standalone: true,
  imports: [RouterLink, ButtonDirective],
  templateUrl: './cta-banner.component.html',
})
export class CtaBanner {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly router = inject(Router);

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

  protected resolvedCtaLink(): string {
    return this.resolvePublicCtaLink(this.ctaLink);
  }

  private buildTrackingPayload(): Record<string, string> {
    const resolvedCtaLink = this.resolvedCtaLink();

    return {
      cta_context: this.ctaContext || 'unknown',
      cta_label: this.ctaLabel,
      cta_link: resolvedCtaLink,
    };
  }

  private resolvePublicCtaLink(link: string): string {
    return (
      findLocalizedPublicRouteEntryByLegacyPath(
        link,
        resolveLocaleFromPublicPath(this.router.url) ?? SOURCE_LOCALE,
      )?.path ?? link
    );
  }
}
