import { Component, output } from '@angular/core';

import { ParticipantNavCtaLink } from './participant-nav-cta-link.component';

@Component({
  selector: 'kraak-participant-nav-cta',
  standalone: true,
  imports: [ParticipantNavCtaLink],
  templateUrl: './participant-nav-cta.component.html',
})
export class ParticipantNavCta {
  readonly activated = output<void>();

  protected notifyActivated(): void {
    this.activated.emit();
  }
}
