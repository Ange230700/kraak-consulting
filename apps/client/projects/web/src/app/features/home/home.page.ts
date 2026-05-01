import { Component, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';

import { CtaBanner } from '../../shared/cta-banner/cta-banner';

@Component({
  selector: 'kraak-home-page',
  standalone: true,
  imports: [
    NgStyle,
    FormsModule,
    RouterLink,
    ButtonDirective,
    InputText,
    CtaBanner,
  ],
  templateUrl: './home.page.html',
})
export default class HomePage {
  email = '';
  private readonly router = inject(Router);

  heroBackgroundStyle = {
    background:
      "linear-gradient(0deg, color-mix(in srgb, var(--p-surface-950) 50%, transparent) 0%, transparent 100%), linear-gradient(0deg, var(--p-primary-500) 0%, var(--p-primary-500) 100%), linear-gradient(0deg, color-mix(in srgb, var(--p-primary-800) 60%, transparent) 0%, color-mix(in srgb, var(--p-primary-800) 60%, transparent) 100%), url('https://fqjltiegiezfetthbags.supabase.co/storage/v1/render/image/public/block.images/blocks/hero/bw-hero-bg.jpg') center/cover no-repeat",
    backgroundBlendMode: 'normal, multiply, lighten, normal',
  };

  onHeroNotifySubmit(): void {
    void this.router.navigate(['/contact'], {
      queryParams: {
        email: this.email || undefined,
        source: 'home_hero_notify',
      },
      queryParamsHandling: 'merge',
    });
  }
}
