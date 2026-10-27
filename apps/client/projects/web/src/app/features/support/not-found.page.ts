import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { KraakTranslatePipe } from '../../../../../shared/i18n';
import { LocalizedPublicPathPipe } from '../../routing/localized-public-path.pipe';

@Component({
  selector: 'kraak-not-found-page',
  standalone: true,
  imports: [
    RouterLink,
    ButtonDirective,
    LocalizedPublicPathPipe,
    KraakTranslatePipe,
  ],
  templateUrl: './not-found.page.html',
})
export default class NotFoundPage {}
