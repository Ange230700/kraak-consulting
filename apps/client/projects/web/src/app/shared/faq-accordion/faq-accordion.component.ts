import { Component, Input, ViewEncapsulation } from '@angular/core';
import { KraakTranslatePipe } from '../../../../../shared/i18n';
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionPanel,
} from 'primeng/accordion';
import { FAQ_BACKGROUND_IMAGE_URL } from '../brand/brand-constants';

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

@Component({
  selector: 'kraak-faq-accordion',
  standalone: true,
  imports: [
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    KraakTranslatePipe,
  ],
  templateUrl: './faq-accordion.component.html',
  styles: [
    `
      .kr-glass-faq .p-accordioncontent {
        overflow: hidden;
      }

      .kr-glass-faq .p-accordioncontent[data-p-active='true'] .p-motion {
        visibility: visible !important;
        max-height: none !important;
      }

      .kr-glass-faq .p-accordioncontent-content {
        background-color: transparent !important;
        padding-bottom: 0 !important;
        padding-inline: 0 !important;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class FaqAccordion {
  @Input({ required: true }) items: readonly FaqItem[] = [];
  @Input() heading: string | null = null;
  @Input() description: string | null = null;
  @Input() backgroundAlt: string | null = null;

  protected readonly backgroundImageUrl = FAQ_BACKGROUND_IMAGE_URL;
}
