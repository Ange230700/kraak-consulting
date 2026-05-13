import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import { PageShell } from '../../shared/page-shell/page-shell.component';
import { FeatureCardComponent } from '../../shared/ui/feature-card/feature-card.component';

@Component({
  selector: 'kraak-welcome-page',
  standalone: true,
  imports: [PageShell, IonButton, RouterLink, FeatureCardComponent],
  templateUrl: './welcome.page.html',
})
export default class WelcomePage {}
