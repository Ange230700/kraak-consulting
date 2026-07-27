import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { LocalizedPublicPathPipe } from '../../routing/localized-public-path.pipe';

@Component({
  selector: 'kraak-not-found-page',
  standalone: true,
  imports: [RouterLink, ButtonDirective, LocalizedPublicPathPipe],
  templateUrl: './not-found.page.html',
})
export default class NotFoundPage {}
