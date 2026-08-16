import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { KraakTranslatePipe } from '../../../../../shared/i18n';

@Component({
  selector: 'kraak-scroll-to-top',
  standalone: true,
  imports: [CommonModule, KraakTranslatePipe],
  templateUrl: './scroll-to-top.component.html',
})
export class ScrollToTop implements OnInit, OnDestroy {
  isVisible = false;
  private readonly scrollThreshold = 300;
  private scrollListener: (() => void) | null = null;
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly isBrowser =
    globalThis.window !== undefined && typeof document !== 'undefined';

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }
    this.scrollListener = () => {
      this.updateVisibility();
    };
    window.addEventListener('scroll', this.scrollListener);
    this.updateVisibility();
  }

  ngOnDestroy(): void {
    if (this.scrollListener && this.isBrowser) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  updateVisibility(): void {
    this.isVisible = window.scrollY > this.scrollThreshold;
    this.cdr.markForCheck();
  }

  scrollToTop(): void {
    if (!this.isBrowser) {
      return;
    }
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }
}
