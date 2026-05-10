import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

@Component({
  selector: 'kraak-not-found-page',
  standalone: true,
  imports: [RouterLink, ButtonDirective],
  templateUrl: './not-found.page.html',
})
export default class NotFoundPage {}
