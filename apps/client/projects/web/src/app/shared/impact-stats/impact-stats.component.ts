import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  IMPACT_STATS_PREVIEW,
  IMPACT_STATS_PREVIEW_SECTION,
  type ImpactStat,
} from '../preview-content';

@Component({
  selector: 'kraak-impact-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './impact-stats.component.html',
})
export class ImpactStats {
  protected readonly previewSection = IMPACT_STATS_PREVIEW_SECTION;
  protected readonly stats: ImpactStat[] = IMPACT_STATS_PREVIEW;
}
