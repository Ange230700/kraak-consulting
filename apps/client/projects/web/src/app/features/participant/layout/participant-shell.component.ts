import { Component, computed, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { WebAuthService } from '../../../core/auth/web-auth.service';

@Component({
  selector: 'kraak-web-participant-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './participant-shell.component.html',
})
export default class ParticipantShell {
  private readonly authService = inject(WebAuthService);
  private readonly router = inject(Router);

  protected readonly currentProfile = this.authService.currentProfile;

  protected readonly displayName = computed(() => {
    const user = this.currentProfile()?.appUser;
    if (!user) {
      return 'Participant';
    }

    return `${user.firstName} ${user.lastName}`.trim();
  });

  protected readonly initials = computed(() => {
    const user = this.currentProfile()?.appUser;
    if (!user) {
      return 'KR';
    }

    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  });

  protected logout(): void {
    this.authService.clearSession();
    void this.router.navigate(['/connexion']);
  }
}
