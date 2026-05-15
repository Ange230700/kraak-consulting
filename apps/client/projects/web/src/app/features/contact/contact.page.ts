import { NgClass, NgStyle } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Textarea } from 'primeng/textarea';
import { logDebugError } from '@kraak/api-client';
import type { ContactFormDto } from '@kraak/contracts';

import {
  CONTACT_EMAIL,
  CONTACT_VISUAL_URL,
  HERO_BACKGROUND_STYLE,
  KRAAK_SOCIAL_LINKS,
  type SocialLink,
} from '../../shared/brand/brand-constants';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import {
  FaqAccordion,
  type FaqItem,
} from '../../shared/faq-accordion/faq-accordion.component';
import { ContactService } from './contact.service';
import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';

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
}

const GENERIC_CONTACT_ERROR_MESSAGE =
  'Une erreur est survenue. Veuillez r\u00E9essayer plus tard.';

@Component({
  selector: 'kraak-contact-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgStyle,
    ButtonDirective,
    InputText,
    Textarea,
    Message,
    FaqAccordion,
    CtaBanner,
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

  protected readonly heroBackgroundStyle = HERO_BACKGROUND_STYLE;

  private readonly contactService = inject(ContactService);
  private readonly messageService = inject(MessageService);
  private readonly gsapService = inject(GsapAnimationsService);

  protected readonly serviceOptions: ServiceOption[] = [
    { label: 'Formation', value: 'formation', category: 'program' },
    {
      label: 'Gestion de projets',
      value: 'project',
      category: 'other',
    },
    {
      label: 'Conseil en immigration',
      value: 'immigration',
      category: 'other',
    },
    { label: 'Solutions entreprises', value: 'business', category: 'other' },
    { label: 'Partenariat', value: 'program', category: 'program' },
    { label: 'Autre demande', value: 'other', category: 'other' },
  ];

  protected readonly socialLinks: readonly SocialLink[] = KRAAK_SOCIAL_LINKS;
  protected readonly whatsappLink =
    KRAAK_SOCIAL_LINKS.find((social) => social.label === 'WhatsApp')?.href ??
    '';

  protected readonly faqItems: FaqItem[] = [
    {
      question: 'Comment obtenir un accompagnement personnalisé avec KRAAK ?',
      answer:
        'Remplissez le formulaire de contact avec votre objectif principal. Notre équipe analyse votre besoin et vous propose une orientation claire sous 48h ouvrées.',
    },
    {
      question: 'Quels types de services propose KRAAK ?',
      answer:
        "Nous intervenons sur la formation, la recherche et gestion de projets, les programmes KRAAK, les solutions entreprises et l'accompagnement en études et immigration.",
    },
    {
      question: 'Puis-je vous contacter directement sur WhatsApp ?',
      answer:
        'Oui. Si vous préférez un échange rapide, le canal WhatsApp reste disponible en complément du formulaire de contact.',
    },
    {
      question: 'Combien de temps faut-il pour recevoir une première réponse ?',
      answer:
        'Après soumission de votre demande, nous revenons généralement vers vous sous 48h ouvrées avec une proposition de prochaine étape.',
    },
  ];

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
      return;
    }

    this.loading.set(true);
    this.success.set(false);

    this.contactService.submit(this.buildPayload()).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        this.messageService.add({
          key: 'app-feedback',
          severity: 'success',
          summary: 'Contact',
          detail:
            'Votre message a bien été envoyé. Notre équipe revient vers vous rapidement.',
          life: 6000,
        });
        this.form.reset();
        this.submitted.set(false);
      },
      error: (errorResponse: HttpErrorResponse) => {
        this.loading.set(false);
        const extractedErrors = this.extractApiErrors(errorResponse);
        this.apiErrors.set(extractedErrors);
        logDebugError('web.contact.submit', errorResponse, {
          route: '/contact',
          status: errorResponse.status,
          apiErrorCount: extractedErrors.length,
        });

        if (
          extractedErrors.length === 1 &&
          extractedErrors[0] === GENERIC_CONTACT_ERROR_MESSAGE
        ) {
          this.messageService.add({
            key: 'app-feedback',
            severity: 'error',
            summary: 'Contact',
            detail: GENERIC_CONTACT_ERROR_MESSAGE,
            life: 7000,
          });
        }
      },
    });
  }

  private extractApiErrors(errorResponse: HttpErrorResponse): string[] {
    const rawErrors = (errorResponse.error as { errors?: unknown })?.errors;

    if (
      Array.isArray(rawErrors) &&
      rawErrors.every((error) => typeof error === 'string') &&
      rawErrors.length > 0
    ) {
      return rawErrors;
    }

    return [GENERIC_CONTACT_ERROR_MESSAGE];
  }

  private buildPayload(): ContactFormDto {
    const selectedOption = this.getSelectedServiceOption();

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
      `Pays : ${this.form.value.country!}`,
      `Type de service : ${selectedOption.label}`,
      '',
      this.form.value.message!,
    ].join('\n');
  }

  private getSelectedServiceOption(): ServiceOption {
    return (
      this.serviceOptions.find(
        (option) => option.value === this.form.value.serviceType,
      ) ?? this.serviceOptions.at(-1)!
    );
  }
}
