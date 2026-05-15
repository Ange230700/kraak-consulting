import { Component, Input } from '@angular/core';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'kraak-badge',
  standalone: true,
  imports: [Tag],
  templateUrl: './badge.component.html',
})
export class Badge {
  @Input({ required: true }) label = '';
  @Input() severity:
    | 'success'
    | 'info'
    | 'warn'
    | 'danger'
    | 'secondary'
    | 'contrast'
    | undefined = undefined;
  @Input() rounded = false;
}
