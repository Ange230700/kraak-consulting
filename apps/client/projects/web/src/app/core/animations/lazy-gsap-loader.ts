import type { Injector } from '@angular/core';

import type { GsapAnimationsService } from './gsap-animations.service';

export class LazyGsapLoader {
  private currentService: GsapAnimationsService | null = null;
  private destroyed = false;

  constructor(private readonly injector: Injector) {}

  get service(): GsapAnimationsService | null {
    return this.currentService;
  }

  async resolve(): Promise<GsapAnimationsService | null> {
    if (this.destroyed || globalThis.window === undefined) {
      return null;
    }

    if (this.currentService) {
      return this.currentService;
    }

    const { GsapAnimationsService } = await import('./gsap-animations.service');
    if (this.destroyed) {
      return null;
    }

    this.currentService = this.injector.get(GsapAnimationsService);
    return this.currentService;
  }

  destroy(): void {
    this.destroyed = true;
    this.currentService?.killAllAnimations();
  }
}
