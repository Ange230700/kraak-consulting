import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { LocalizedPublicPathPipe } from '../../routing/localized-public-path.pipe';

@Component({
  selector: 'kraak-unauthorized-page',
  standalone: true,
  imports: [RouterLink, ButtonDirective, LocalizedPublicPathPipe],
  templateUrl: './unauthorized.page.html',
})
export default class UnauthorizedPage {}
