import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  inject,
} from '@angular/core';

@Directive({
  selector: '[kraakRevealOnScroll]',
})
export class RevealOnScrollDirective implements OnInit, OnDestroy {
  @Input() revealDelayMs = 0;
  @Input() revealDelayMobileMs?: number;
  @Input() revealOnce = true;
  @Input() revealThreshold = 0.2;

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const element = this.elementRef.nativeElement;
    const revealDelayMs = this.resolveRevealDelayMs();

    this.renderer.addClass(element, 'motion-reveal-base');
    this.renderer.setStyle(element, 'transition-delay', `${revealDelayMs}ms`);

    if (
      globalThis.window === undefined ||
      !('IntersectionObserver' in globalThis.window)
    ) {
      this.renderer.addClass(element, 'motion-reveal-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            if (!this.revealOnce) {
              this.renderer.removeClass(element, 'motion-reveal-visible');
            }
            continue;
          }

          this.renderer.addClass(element, 'motion-reveal-visible');

          if (this.revealOnce) {
            this.observer?.unobserve(element);
          }
        }
      },
      {
        threshold: this.revealThreshold,
      },
    );

    this.observer.observe(element);
  }

  private resolveRevealDelayMs(): number {
    if (this.revealDelayMobileMs === undefined) {
      return this.revealDelayMs;
    }

    if (
      globalThis.window === undefined ||
      typeof globalThis.matchMedia !== 'function'
    ) {
      return this.revealDelayMs;
    }

    const isMobileViewport =
      globalThis.matchMedia('(max-width: 767px)').matches;

    return isMobileViewport ? this.revealDelayMobileMs : this.revealDelayMs;
  }

  ngOnDestroy(): void {
    const element = this.elementRef.nativeElement;

    try {
      this.observer?.unobserve(element);
      this.observer?.disconnect();
    } catch (error) {
      console.warn('[RevealOnScrollDirective] Observer cleanup failed.', {
        context: 'ngOnDestroy',
        error,
      });
    }
  }
}
