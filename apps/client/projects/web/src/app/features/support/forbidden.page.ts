import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

@Component({
  selector: 'kraak-forbidden-page',
  standalone: true,
  imports: [RouterLink, ButtonDirective],
  templateUrl: './forbidden.page.html',
})
export default class ForbiddenPage {}
