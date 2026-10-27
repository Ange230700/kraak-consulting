import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { KraakTranslatePipe } from '../../../../../shared/i18n';
import { LocalizedPublicPathPipe } from '../../routing/localized-public-path.pipe';

@Component({
  selector: 'kraak-server-error-page',
  standalone: true,
  imports: [
    RouterLink,
    ButtonDirective,
    LocalizedPublicPathPipe,
    KraakTranslatePipe,
  ],
  templateUrl: './server-error.page.html',
})
export default class ServerErrorPage {}
