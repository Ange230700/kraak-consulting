import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { CtaBanner } from '../../shared/cta-banner/cta-banner';
import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';

@Component({
  selector: 'kraak-home-page',
  standalone: true,
  imports: [NgStyle, RouterLink, ButtonDirective, CtaBanner],
  templateUrl: './home.page.html',
})
export default class HomePage implements OnInit, OnDestroy {
  heroBackgroundStyle = {
    background:
      "linear-gradient(0deg, color-mix(in srgb, var(--p-surface-950) 50%, transparent) 0%, transparent 100%), linear-gradient(0deg, var(--p-primary-500) 0%, var(--p-primary-500) 100%), linear-gradient(0deg, color-mix(in srgb, var(--p-primary-800) 60%, transparent) 0%, color-mix(in srgb, var(--p-primary-800) 60%, transparent) 100%), url('https://fqjltiegiezfetthbags.supabase.co/storage/v1/render/image/public/block.images/blocks/hero/bw-hero-bg.jpg') center/cover no-repeat",
    backgroundBlendMode: 'normal, multiply, lighten, normal',
  };

  private readonly gsapService = inject(GsapAnimationsService);

  ngOnInit(): void {
    this.gsapService.initializeFigureAnimations('figure.reveal-on-scroll');
    this.gsapService.initializeInteractiveCardAnimations('article');
  }

  ngOnDestroy(): void {
    this.gsapService.killAllAnimations();
  }
}
