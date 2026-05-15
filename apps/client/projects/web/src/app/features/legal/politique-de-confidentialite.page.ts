import { Component } from '@angular/core';

import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';

@Component({
  selector: 'kraak-politique-de-confidentialite-page',
  standalone: true,
  imports: [CtaBanner],
  templateUrl: './politique-de-confidentialite.page.html',
})
export default class PolitiqueDeConfidentialitePage {}
