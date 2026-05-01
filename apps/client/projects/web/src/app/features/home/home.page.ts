import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { NgStyle } from '@angular/common';

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

  heroBackgroundStyle = {
    background:
      "linear-gradient(0deg, color-mix(in srgb, var(--p-surface-950) 55%, transparent) 0%, transparent 100%), linear-gradient(0deg, color-mix(in srgb, var(--p-primary-700) 72%, transparent) 0%, color-mix(in srgb, var(--p-primary-700) 72%, transparent) 100%), url('https://fqjltiegiezfetthbags.supabase.co/storage/v1/render/image/public/block.images/blocks/hero/bw-hero-bg.jpg') center/cover no-repeat",
    backgroundBlendMode: 'normal, multiply, normal',
  };
}
