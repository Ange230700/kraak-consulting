import { Component } from '@angular/core';

import { FadingPartners } from '../fading-partners/fading-partners.component';
import { ImpactStats } from '../impact-stats/impact-stats.component';
import { Testimonials } from '../testimonials/testimonials.component';

@Component({
  selector: 'kraak-home-preview-sections',
  standalone: true,
  imports: [FadingPartners, ImpactStats, Testimonials],
  templateUrl: './home-preview-sections.component.html',
})
export class HomePreviewSections {}
