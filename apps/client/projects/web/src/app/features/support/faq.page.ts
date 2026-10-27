import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../shared/i18n';
import { LocalizedPublicPathPipe } from '../../routing/localized-public-path.pipe';
import { CONTACT_EMAIL } from '../../shared/brand/brand-constants';
import {
  FaqAccordion,
  type FaqItem,
} from '../../shared/faq-accordion/faq-accordion.component';

@Component({
  selector: 'kraak-faq-page',
  standalone: true,
  imports: [
    RouterLink,
    FaqAccordion,
    LocalizedPublicPathPipe,
    KraakTranslatePipe,
  ],
  templateUrl: './faq.page.html',
})
export default class FaqPage {
  private readonly i18n = inject(KraakI18nService);

  protected get faqItems(): FaqItem[] {
    return [
      {
        question: this.i18n.translate(
          'web.faq.items.accompanimentChoice.question',
        ),
        answer: this.i18n.translate('web.faq.items.accompanimentChoice.answer'),
      },
      {
        question: this.i18n.translate('web.faq.items.gettingStarted.question'),
        answer: `${this.i18n.translate(
          'web.faq.items.gettingStarted.answerBeforeEmail',
        )} ${CONTACT_EMAIL} ${this.i18n.translate(
          'web.faq.items.gettingStarted.answerAfterEmail',
        )}`,
      },
      {
        question: this.i18n.translate('web.faq.items.remoteSupport.question'),
        answer: this.i18n.translate('web.faq.items.remoteSupport.answer'),
      },
      {
        question: this.i18n.translate('web.faq.items.audiences.question'),
        answer: this.i18n.translate('web.faq.items.audiences.answer'),
      },
      {
        question: this.i18n.translate('web.faq.items.responseTime.question'),
        answer: this.i18n.translate('web.faq.items.responseTime.answer'),
      },
      {
        question: this.i18n.translate(
          'web.faq.items.internationalMobility.question',
        ),
        answer: this.i18n.translate(
          'web.faq.items.internationalMobility.answer',
        ),
      },
      {
        question: this.i18n.translate('web.faq.items.guarantees.question'),
        answer: this.i18n.translate('web.faq.items.guarantees.answer'),
      },
      {
        question: this.i18n.translate('web.faq.items.earlyStage.question'),
        answer: this.i18n.translate('web.faq.items.earlyStage.answer'),
      },
      {
        question: this.i18n.translate('web.faq.items.contactData.question'),
        answer: this.i18n.translate('web.faq.items.contactData.answer'),
      },
    ];
  }
}
