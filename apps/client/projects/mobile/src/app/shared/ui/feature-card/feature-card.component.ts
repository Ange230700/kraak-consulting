import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type FeatureCardTone = 'primary' | 'accent';

@Component({
  selector: 'kraak-feature-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feature-card.component.html',
})
export class FeatureCardComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
  @Input() tag = '';
  @Input() tone: FeatureCardTone = 'primary';

  get cardClasses(): string {
    const baseClasses = 'kraak-surface-card p-4';
    const toneClasses: Record<FeatureCardTone, string> = {
      primary: 'border-brand-blue/12',
      accent: 'border-brand-cyan/18',
    };

    return `${baseClasses} ${toneClasses[this.tone]}`;
  }

  get tagClasses(): string {
    return this.tone === 'accent'
      ? 'kraak-overline text-accent'
      : 'kraak-overline';
  }
}
