import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { KraakTranslatePipe } from '../../../../../shared/i18n';

interface ImpactStat {
  title: string;
  label: string;
}

@Component({
  selector: 'kraak-impact-stats',
  standalone: true,
  imports: [KraakTranslatePipe, CommonModule],
  templateUrl: './impact-stats.component.html',
})
export class ImpactStats {
  protected readonly stats: ImpactStat[] = [
    {
      title: '1M+',
      label: 'web.shared.impactStats.skills',
    },
    {
      title: '72K+',
      label: 'web.shared.impactStats.pathways',
    },
    {
      title: '2.5M+',
      label: 'web.shared.impactStats.participants',
    },
  ];
}
