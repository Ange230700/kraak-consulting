import { Component, Input, ViewEncapsulation } from '@angular/core';
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionPanel,
} from 'primeng/accordion';
import { FAQ_BACKGROUND_IMAGE_URL } from '../brand/brand-constants';

export interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'kraak-faq-accordion',
  standalone: true,
  imports: [Accordion, AccordionPanel, AccordionHeader, AccordionContent],
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
  @Input({ required: true }) items: FaqItem[] = [];

  protected readonly backgroundImageUrl = FAQ_BACKGROUND_IMAGE_URL;
}
