import { Component } from '@angular/core';

import { CtaBanner } from '../../shared/cta-banner/cta-banner';

@Component({
  selector: 'kraak-resources-page',
  standalone: true,
  imports: [CtaBanner],
  templateUrl: './resources.page.html',
})
export default class ResourcesPage {}
