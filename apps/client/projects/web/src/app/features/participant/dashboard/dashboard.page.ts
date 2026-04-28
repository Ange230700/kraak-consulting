import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WebAuthService } from '../../../core/auth/web-auth.service';

@Component({
  selector: 'kraak-web-participant-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export default class DashboardPage {
  private readonly authService = inject(WebAuthService);

  readonly currentProfile = this.authService.currentProfile;
}
