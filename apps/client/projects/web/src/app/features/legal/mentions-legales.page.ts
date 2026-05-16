import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
  WHATSAPP_CONTACT_HREF,
} from '../../shared/brand/brand-constants';
import { PublicConversionTrackingDirective } from '../../shared/analytics/public-conversion-tracking.directive';

@Component({
  selector: 'kraak-mentions-legales-page',
  standalone: true,
  imports: [CtaBanner, RouterLink, PublicConversionTrackingDirective],
  templateUrl: './mentions-legales.page.html',
})
export default class MentionsLegalesPage {
  protected readonly contactEmail = CONTACT_EMAIL;
  protected readonly contactEmailHref = `mailto:${CONTACT_EMAIL}`;
  protected readonly contactPhoneDisplay = CONTACT_PHONE_DISPLAY;
  protected readonly contactPhoneHref = CONTACT_PHONE_HREF;
  protected readonly whatsappContactHref = WHATSAPP_CONTACT_HREF;
}
