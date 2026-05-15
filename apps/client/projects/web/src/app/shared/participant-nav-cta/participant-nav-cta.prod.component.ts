import { Component, output } from '@angular/core';

@Component({
  selector: 'kraak-participant-nav-cta',
  standalone: true,
  templateUrl: './participant-nav-cta.prod.component.html',
})
export class ParticipantNavCta {
  readonly activated = output<void>();

  protected notifyActivated(): void {
    this.activated.emit();
  }
}
