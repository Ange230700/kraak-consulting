import { Component, Input, ViewEncapsulation } from '@angular/core';
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionPanel,
} from 'primeng/accordion';

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

  protected readonly backgroundImageUrl =
    'https://fqjltiegiezfetthbags.supabase.co/storage/v1/render/image/public/block.images/blocks/faq/glassmorphic-accordion-bg.jpg';
}
