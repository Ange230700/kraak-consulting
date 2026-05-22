import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface ImpactStat {
  title: string;
  label: string;
}

@Component({
  selector: 'kraak-impact-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './impact-stats.html',
})
export class ImpactStats {
  protected readonly stats: ImpactStat[] = [
    {
      title: '1M+',
      label: 'Compétences activées vers des opportunités concrètes',
    },
    {
      title: '72K+',
      label: 'Parcours structurés lancés avec accompagnement ciblé',
    },
    {
      title: '2.5M+',
      label: 'Participants orientés vers emploi, projet ou mobilité',
    },
  ];
}
