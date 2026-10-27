import { Component, Injector, OnInit, OnDestroy, inject } from '@angular/core';
import { NgClass } from '@angular/common';

import { KraakTranslatePipe } from '../../../../../shared/i18n/kraak-i18n.pipe';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import { RevealOnScrollDirective } from '../../shared/motion/reveal-on-scroll.directive';
import { LazyGsapLoader } from '../../core/animations/lazy-gsap-loader';
import { initializeMarketingPageAnimations } from '../../core/animations/marketing-page-animations';

interface ProgramFormatTranslation {
  readonly iconClass: string;
  readonly titleKey: string;
  readonly formatKey: string;
  readonly audienceKey: string;
  readonly cadenceKey: string;
}

interface ProgramCatalogTranslation {
  readonly titleKey: string;
  readonly descriptionKey: string;
}

interface ProgramProcessTranslation extends ProgramCatalogTranslation {
  readonly step: number;
}

const PROGRAM_FORMAT_TRANSLATIONS = [
  {
    iconClass: 'pi-briefcase',
    titleKey: 'web.programs.formats.items.employability.title',
    formatKey: 'web.programs.formats.items.employability.format',
    audienceKey: 'web.programs.formats.items.employability.audience',
    cadenceKey: 'web.programs.formats.items.employability.cadence',
  },
  {
    iconClass: 'pi-language',
    titleKey: 'web.programs.formats.items.languagePreparation.title',
    formatKey: 'web.programs.formats.items.languagePreparation.format',
    audienceKey: 'web.programs.formats.items.languagePreparation.audience',
    cadenceKey: 'web.programs.formats.items.languagePreparation.cadence',
  },
  {
    iconClass: 'pi-globe',
    titleKey: 'web.programs.formats.items.internationalMobility.title',
    formatKey: 'web.programs.formats.items.internationalMobility.format',
    audienceKey: 'web.programs.formats.items.internationalMobility.audience',
    cadenceKey: 'web.programs.formats.items.internationalMobility.cadence',
  },
  {
    iconClass: 'pi-users',
    titleKey: 'web.programs.formats.items.collectiveInterventions.title',
    formatKey: 'web.programs.formats.items.collectiveInterventions.format',
    audienceKey: 'web.programs.formats.items.collectiveInterventions.audience',
    cadenceKey: 'web.programs.formats.items.collectiveInterventions.cadence',
  },
] as const satisfies readonly ProgramFormatTranslation[];

const PROGRAM_CATALOG_TRANSLATIONS = [
  {
    titleKey: 'web.programs.catalog.items.exactTitle.title',
    descriptionKey: 'web.programs.catalog.items.exactTitle.description',
  },
  {
    titleKey: 'web.programs.catalog.items.schedule.title',
    descriptionKey: 'web.programs.catalog.items.schedule.description',
  },
  {
    titleKey: 'web.programs.catalog.items.eligibility.title',
    descriptionKey: 'web.programs.catalog.items.eligibility.description',
  },
  {
    titleKey: 'web.programs.catalog.items.arrangements.title',
    descriptionKey: 'web.programs.catalog.items.arrangements.description',
  },
] as const satisfies readonly ProgramCatalogTranslation[];

const PROGRAM_PROCESS_TRANSLATIONS = [
  {
    step: 1,
    titleKey: 'web.programs.process.steps.contactRequest.title',
    descriptionKey: 'web.programs.process.steps.contactRequest.description',
  },
  {
    step: 2,
    titleKey: 'web.programs.process.steps.guidanceConversation.title',
    descriptionKey:
      'web.programs.process.steps.guidanceConversation.description',
  },
  {
    step: 3,
    titleKey: 'web.programs.process.steps.formatProposal.title',
    descriptionKey: 'web.programs.process.steps.formatProposal.description',
  },
  {
    step: 4,
    titleKey: 'web.programs.process.steps.confirmation.title',
    descriptionKey: 'web.programs.process.steps.confirmation.description',
  },
] as const satisfies readonly ProgramProcessTranslation[];

@Component({
  selector: 'kraak-programs-page',
  standalone: true,
  imports: [NgClass, CtaBanner, RevealOnScrollDirective, KraakTranslatePipe],
  templateUrl: './programs.page.html',
})
export default class ProgramsPage implements OnInit, OnDestroy {
  protected readonly programFormats = PROGRAM_FORMAT_TRANSLATIONS;
  protected readonly catalogItems = PROGRAM_CATALOG_TRANSLATIONS;
  protected readonly processSteps = PROGRAM_PROCESS_TRANSLATIONS;

  private readonly animations = new LazyGsapLoader(inject(Injector));

  ngOnInit(): void {
    void this.initializeAnimations();
  }

  ngOnDestroy(): void {
    this.animations.destroy();
  }

  private async initializeAnimations(): Promise<void> {
    const gsapService = await this.animations.resolve();
    if (!gsapService) {
      return;
    }

    initializeMarketingPageAnimations(gsapService, {
      reversibleSelector: 'article[data-motion="reversible"]',
      icons: false,
      listItems: true,
    });
  }
}
