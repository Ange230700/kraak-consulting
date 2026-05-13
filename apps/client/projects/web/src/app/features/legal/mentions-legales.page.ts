import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';

@Component({
  selector: 'kraak-mentions-legales-page',
  standalone: true,
  imports: [CtaBanner, RouterLink],
  templateUrl: './mentions-legales.page.html',
})
export default class MentionsLegalesPage {}
