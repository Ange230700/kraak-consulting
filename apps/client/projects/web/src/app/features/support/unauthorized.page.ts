import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

@Component({
  selector: 'kraak-unauthorized-page',
  standalone: true,
  imports: [RouterLink, ButtonDirective],
  templateUrl: './unauthorized.page.html',
})
export default class UnauthorizedPage {}
