import { Component, Input } from '@angular/core';

@Component({
  selector: 'kraak-section',
  standalone: true,
  templateUrl: './section.component.html',
})
export class Section {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() size: 'default' | 'lg' = 'default';
  @Input() background: 'default' | 'alt' | 'primary' = 'default';

  protected get sectionClass(): string {
    const sizeClass = this.size === 'lg' ? 'py-24 lg:py-28' : 'py-16 lg:py-20';
    const bgClass = {
      default: '',
      alt: 'bg-neutral-50',
      primary: 'bg-primary text-brand-white',
    }[this.background];

    return `${sizeClass} ${bgClass}`.trim();
  }

  protected get titleClass(): string {
    return this.background === 'primary'
      ? 'text-3xl font-semibold text-brand-white lg:text-4xl'
      : 'text-3xl font-semibold text-primary lg:text-4xl';
  }

  protected get subtitleClass(): string {
    return this.background === 'primary'
      ? 'mt-4 text-base leading-7 text-brand-white/80'
      : 'mt-4 text-base leading-7 text-neutral-700';
  }
}
