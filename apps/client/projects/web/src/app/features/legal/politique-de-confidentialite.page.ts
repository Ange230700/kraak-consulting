import { Component } from '@angular/core';

import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
} from '../../shared/brand/brand-constants';
import { PublicConversionTrackingDirective } from '../../shared/analytics/public-conversion-tracking.directive';

@Component({
  selector: 'kraak-politique-de-confidentialite-page',
  standalone: true,
  imports: [CtaBanner, PublicConversionTrackingDirective],
  templateUrl: './politique-de-confidentialite.page.html',
})
export default class PolitiqueDeConfidentialitePage {
  protected readonly contactEmail = CONTACT_EMAIL;
  protected readonly contactEmailHref = `mailto:${CONTACT_EMAIL}`;
  protected readonly contactPhoneDisplay = CONTACT_PHONE_DISPLAY;
  protected readonly contactPhoneHref = CONTACT_PHONE_HREF;
}
