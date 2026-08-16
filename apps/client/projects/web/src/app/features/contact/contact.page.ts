// apps\client\projects\web\src\app\features\contact\contact.page.ts

import { NgClass, NgStyle } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ContactFormDto } from '@kraak/contracts';
import { logDebugError } from '@kraak/api-client';
import { ButtonDirective, Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Textarea } from 'primeng/textarea';

import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
  CONTACT_VISUAL_URL,
  KRAAK_SOCIAL_LINKS,
  buildHeroBackgroundStyle,
  type SocialLink,
} from '../../shared/brand/brand-constants';
import { PublicConversionTrackingDirective } from '../../shared/analytics/public-conversion-tracking.directive';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import { RevealOnScrollDirective } from '../../shared/motion/reveal-on-scroll.directive';
import { LocalizedPublicPathPipe } from '../../routing/localized-public-path.pipe';
import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../shared/i18n';
import { ContactService } from './contact.service';

type ServiceType =
  | 'formation'
  | 'project'
  | 'immigration'
  | 'business'
  | 'program'
  | 'other';

interface ServiceOption {
  label: string;
  value: ServiceType;
  category: ContactFormDto['category'];
  triagePath: string;
  responseWorkflow: string;
  fallbackWorkflow: string;
}

const CONTACT_HERO_BACKGROUND_STYLE = buildHeroBackgroundStyle(
  '/assets/site-visuals/photos/services-coaching.avif',
);

interface ServiceOptionDefinition {
  readonly translationId:
    | 'training'
    | 'project'
    | 'immigration'
    | 'business'
    | 'partnership'
    | 'other';
  readonly value: ServiceType;
  readonly category: ContactFormDto['category'];
  readonly triagePath: string;
}

const SERVICE_OPTION_DEFINITIONS: readonly ServiceOptionDefinition[] = [
  {
    translationId: 'training',
    value: 'formation',
    category: 'training',
    triagePath: 'formation/orientation-public',
  },
  {
    translationId: 'project',
    value: 'project',
    category: 'project_management',
    triagePath: 'conseil/gestion-de-projets',
  },
  {
    translationId: 'immigration',
    value: 'immigration',
    category: 'immigration',
    triagePath: 'conseil/mobilite-internationale',
  },
  {
    translationId: 'business',
    value: 'business',
    category: 'business',
    triagePath: 'partenariats/organisations-et-entreprises',
  },
  {
    translationId: 'partnership',
    value: 'program',
    category: 'partnership',
    triagePath: 'partenariats/institutionnel',
  },
  {
    translationId: 'other',
    value: 'other',
    category: 'other',
    triagePath: 'intake/general',
  },
];

@Component({
  selector: 'kraak-contact-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgStyle,
    ButtonDirective,
    Button,
    InputText,
    Textarea,
    Message,
    RouterLink,
    CtaBanner,
    PublicConversionTrackingDirective,
    RevealOnScrollDirective,
    LocalizedPublicPathPipe,
    KraakTranslatePipe,
  ],
  templateUrl: './contact.page.html',
  styles: [
    `
      .kr-perf-section {
        content-visibility: auto;
        contain-intrinsic-size: 1px 900px;
      }
    `,
  ],
})
export default class ContactPage implements OnInit, OnDestroy {
  protected readonly contactVisualUrl = CONTACT_VISUAL_URL;
  protected readonly contactEmail = CONTACT_EMAIL;
  protected readonly contactEmailHref = `mailto:${CONTACT_EMAIL}`;
  protected readonly contactPhone = CONTACT_PHONE_DISPLAY;
  protected readonly contactPhoneHref = CONTACT_PHONE_HREF;
  protected readonly heroBackgroundStyle = CONTACT_HERO_BACKGROUND_STYLE;

  private readonly contactService = inject(ContactService);
  private readonly gsapService = inject(GsapAnimationsService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly i18n = inject(KraakI18nService);

  protected get serviceOptions(): readonly ServiceOption[] {
    this.i18n.locale();

    return SERVICE_OPTION_DEFINITIONS.map((definition) => {
      const translationPrefix =
        'web.contact.form.serviceOptions.' + definition.translationId;

      return {
        value: definition.value,
        category: definition.category,
        triagePath: definition.triagePath,
        label: this.i18n.translate(translationPrefix + '.label'),
        responseWorkflow: this.i18n.translate(
          translationPrefix + '.responseWorkflow',
        ),
        fallbackWorkflow: this.i18n.translate(
          translationPrefix + '.fallbackWorkflow',
        ),
      };
    });
  }

  protected get helpLabelSeparator(): string {
    return this.i18n.locale() === 'fr-CI' ? ' :' : ':';
  }

  protected readonly socialLinks: readonly SocialLink[] = KRAAK_SOCIAL_LINKS;
  protected readonly whatsappLink =
    KRAAK_SOCIAL_LINKS.find((social) => social.label === 'WhatsApp')?.href ??
    '';

  readonly form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    subject: new FormControl('', [Validators.required]),
    country: new FormControl('', [Validators.required]),
    serviceType: new FormControl<ServiceType>('formation', [
      Validators.required,
    ]),
    message: new FormControl('', [
      Validators.required,
      Validators.minLength(10),
    ]),
  });

  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly success = signal(false);
  readonly apiErrors = signal<string[]>([]);

  ngOnInit(): void {
    this.gsapService.animatePageIn();
    this.gsapService.initializeFigureAnimations('figure.reveal-on-scroll');
    this.gsapService.initializeInteractiveCardAnimations('article');
    this.gsapService.initializeButtonTransitions();
    this.gsapService.initializeFormFieldAnimations();
    this.gsapService.initializeSectionAnimations();
  }

  ngOnDestroy(): void {
    this.gsapService.killAllAnimations();
  }

  get name(): AbstractControl {
    return this.form.get('name')!;
  }

  get email(): AbstractControl {
    return this.form.get('email')!;
  }

  get subject(): AbstractControl {
    return this.form.get('subject')!;
  }

  get country(): AbstractControl {
    return this.form.get('country')!;
  }

  get serviceType(): AbstractControl {
    return this.form.get('serviceType')!;
  }

  get message(): AbstractControl {
    return this.form.get('message')!;
  }

  isInvalid(control: AbstractControl): boolean {
    return (
      control.invalid && (control.dirty || control.touched || this.submitted())
    );
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.apiErrors.set([]);

    if (this.form.invalid) {
      this.trackContactSubmitFailure(
        'validation',
        this.getSelectedServiceOption(),
      );
      return;
    }

    const selectedOption = this.getSelectedServiceOption();

    this.loading.set(true);
    this.success.set(false);

    this.contactService.submit(this.buildPayload(selectedOption)).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        this.trackContactSubmitSuccess(selectedOption);
        this.form.reset();
        this.submitted.set(false);
      },
      error: (errorResponse: HttpErrorResponse) => {
        this.loading.set(false);
        const resolvedErrors = this.resolveApiErrors(errorResponse);
        this.apiErrors.set(resolvedErrors.messages);
        this.trackContactSubmitFailure('api', selectedOption, {
          error_count: resolvedErrors.sourceCount,
          status: errorResponse.status,
        });
        logDebugError('web.contact.submit', errorResponse, {
          route: '/contact',
          status: errorResponse.status,
          apiErrorCount: resolvedErrors.sourceCount,
        });
      },
    });
  }

  private resolveApiErrors(errorResponse: HttpErrorResponse): {
    messages: string[];
    sourceCount: number;
  } {
    const sourceErrors = this.extractSourceApiErrors(errorResponse);
    const genericError = this.i18n.translate('web.contact.form.genericError');
    const messages =
      this.i18n.locale() === 'fr-CI' && sourceErrors.length > 0
        ? sourceErrors
        : [genericError];

    return {
      messages,
      sourceCount: Math.max(sourceErrors.length, 1),
    };
  }

  private extractSourceApiErrors(errorResponse: HttpErrorResponse): string[] {
    const errorBody = errorResponse.error as
      | { errors?: unknown; message?: unknown }
      | undefined;
    const rawErrors = errorBody?.errors;

    if (
      Array.isArray(rawErrors) &&
      rawErrors.every((error) => typeof error === 'string') &&
      rawErrors.length > 0
    ) {
      return rawErrors;
    }

    if (
      typeof errorBody?.message === 'string' &&
      errorBody.message.trim() &&
      errorBody.message !== 'Internal Server Error'
    ) {
      return [errorBody.message.trim()];
    }

    return [];
  }

  private buildPayload(selectedOption: ServiceOption): ContactFormDto {
    return {
      name: this.form.value.name!,
      email: this.form.value.email!,
      subject: this.form.value.subject!,
      message: this.buildMessage(selectedOption),
      category: selectedOption.category,
    };
  }

  private buildMessage(selectedOption: ServiceOption): string {
    return [
      this.buildMessageLine(
        'web.contact.form.fields.country.label',
        this.form.value.country!,
      ),
      this.buildMessageLine(
        'web.contact.form.fields.serviceType.label',
        selectedOption.label,
      ),
      this.buildMessageLine(
        'web.contact.form.fields.serviceType.internalQueueLabel',
        selectedOption.triagePath,
      ),
      this.buildMessageLine(
        'web.contact.form.fields.serviceType.responseWorkflowLabel',
        selectedOption.responseWorkflow,
      ),
      this.buildMessageLine(
        'web.contact.form.fields.serviceType.fallbackWorkflowLabel',
        selectedOption.fallbackWorkflow,
      ),
      '',
      this.form.value.message!,
    ].join('\n');
  }

  private buildMessageLine(labelKey: string, value: string): string {
    const separator = this.i18n.locale() === 'fr-CI' ? ' : ' : ': ';
    return this.i18n.translate(labelKey) + separator + value;
  }

  protected getSelectedServiceOption(): ServiceOption {
    return (
      this.serviceOptions.find(
        (option) => option.value === this.form.value.serviceType,
      ) ?? this.serviceOptions.at(-1)!
    );
  }

  protected shouldShowContactFallback(): boolean {
    return this.apiErrors().length > 0;
  }

  private trackContactSubmitSuccess(selectedOption: ServiceOption): void {
    this.analyticsService.trackEvent(
      'contact_submit_success',
      this.buildContactSubmitTrackingPayload(selectedOption),
    );
  }

  private trackContactSubmitFailure(
    failureType: 'api' | 'validation',
    selectedOption: ServiceOption,
    details: Record<string, number> = {},
  ): void {
    this.analyticsService.trackEvent('contact_submit_failure', {
      ...this.buildContactSubmitTrackingPayload(selectedOption),
      ...details,
      failure_type: failureType,
    });
  }

  private buildContactSubmitTrackingPayload(
    selectedOption: ServiceOption,
  ): Record<string, string> {
    return {
      contact_category: selectedOption.category,
      route: '/contact',
      service_type: selectedOption.value,
    };
  }
}
