import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CtaBanner } from '../../shared/cta-banner/cta-banner';

@Component({
  selector: 'kraak-services-page',
  standalone: true,
  imports: [RouterLink, CtaBanner],
  templateUrl: './services.page.html',
})
export default class ServicesPage {}
