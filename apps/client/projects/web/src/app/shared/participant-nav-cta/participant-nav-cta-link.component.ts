import { Component, output } from '@angular/core';
import { RouterModule } from '@angular/router';

import { isParticipantAreaEnabled } from '../../core/runtime/runtime-config';

@Component({
  selector: 'kraak-participant-nav-cta-link',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './participant-nav-cta-link.component.html',
})
export class ParticipantNavCtaLink {
  protected readonly participantAreaEnabled = isParticipantAreaEnabled();

  readonly activated = output<void>();

  protected notifyActivated(): void {
    this.activated.emit();
  }
}
