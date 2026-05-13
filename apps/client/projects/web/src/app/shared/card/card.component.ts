import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Card as PrimeCard } from 'primeng/card';

@Component({
  selector: 'kraak-card',
  standalone: true,
  imports: [RouterLink, ButtonDirective, PrimeCard],
  templateUrl: './card.component.html',
})
export class Card {
  @Input() title = '';
  @Input() description = '';
  @Input() icon = '';
  @Input() link = '';
  @Input() linkLabel = '';
}
