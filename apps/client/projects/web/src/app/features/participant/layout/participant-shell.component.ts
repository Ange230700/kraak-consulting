import { Component, InjectionToken, computed, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { WebAuthService } from '../../../core/auth/web-auth.service';
import { findLocalizedPublicRouteEntryByLegacyPath } from '../../../routing/localized-public-routes';
import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../../shared/i18n';

export const PARTICIPANT_SUPPORT_ROUTE = new InjectionToken(
  'PARTICIPANT_SUPPORT_ROUTE',
  {
    providedIn: 'root',
    factory: () => findLocalizedPublicRouteEntryByLegacyPath,
  },
);

@Component({
  selector: 'kraak-web-participant-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, KraakTranslatePipe],
  templateUrl: './participant-shell.component.html',
})
export default class ParticipantShell {
  private readonly authService = inject(WebAuthService);
  private readonly i18n = inject(KraakI18nService);
  private readonly router = inject(Router);
  private readonly supportRoute = inject(PARTICIPANT_SUPPORT_ROUTE);

  protected readonly currentProfile = this.authService.currentProfile;

  protected readonly supportPath = computed(
    () => this.supportRoute('/contact', this.i18n.locale())?.path ?? '/contact',
  );

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
