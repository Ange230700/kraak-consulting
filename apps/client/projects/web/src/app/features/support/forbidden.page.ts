import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { KraakTranslatePipe } from '../../../../../shared/i18n';
import { LocalizedPublicPathPipe } from '../../routing/localized-public-path.pipe';

@Component({
  selector: 'kraak-forbidden-page',
  standalone: true,
  imports: [
    RouterLink,
    ButtonDirective,
    LocalizedPublicPathPipe,
    KraakTranslatePipe,
  ],
  templateUrl: './forbidden.page.html',
})
export default class ForbiddenPage {}
