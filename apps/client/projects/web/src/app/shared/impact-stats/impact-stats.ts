import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IMPACT_STATS_PREVIEW, type ImpactStat } from '../preview-content';

@Component({
  selector: 'kraak-impact-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './impact-stats.html',
})
export class ImpactStats {
  protected readonly stats: ImpactStat[] = IMPACT_STATS_PREVIEW;
}
