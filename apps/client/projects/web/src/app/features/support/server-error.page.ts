import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

@Component({
  selector: 'kraak-server-error-page',
  standalone: true,
  imports: [RouterLink, ButtonDirective],
  templateUrl: './server-error.page.html',
})
export default class ServerErrorPage {}
