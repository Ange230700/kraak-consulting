// apps\client\projects\web\src\app\features\contact\contact.page.spec.ts

import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
  KRAAK_SOCIAL_LINKS,
} from '../../shared/brand/brand-constants';

import ContactPage from './contact.page';

const WHATSAPP_URL =
  KRAAK_SOCIAL_LINKS.find((socialLink) => socialLink.label === 'WhatsApp')
    ?.href ?? '';

function dispatchTrackedClick(link: HTMLAnchorElement): void {
  link.addEventListener('click', (event) => event.preventDefault(), {
    once: true,
  });
  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    }),
  );
}

function normalizedText(element: Element | null): string {
  return (element?.textContent ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.!?])/g, '$1')
    .trim();
}

describe('ContactPage', () => {
  let httpTestingController: HttpTestingController;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let analyticsService: Pick<AnalyticsService, 'trackEvent'>;

  beforeEach(async () => {
    analyticsService = {
      trackEvent: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ContactPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideKraakI18n(),
        { provide: AnalyticsService, useValue: analyticsService },
      ],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;

    httpTestingController = TestBed.inject(HttpTestingController);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      return undefined;
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  // Given la page de contact est chargée
  // When le composant est instancié
  // Then il doit être créé sans erreur
  it('Given la page de contact When le composant est instancie Then il se crée sans erreur', () => {
    const fixture = TestBed.createComponent(ContactPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  // Given la page de contact est affichée
  // When le contenu est rendu
  // Then le titre principal doit \u00EAtre visible
  it('Given la page de contact When le contenu est rendu Then le titre principal est visible', () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent).toContain('Parlez-nous de votre objectif.');
  });

  it('Given the French contact route When the page renders Then visitor copy and accessible text preserve the French source content', async () => {
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');

    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;

    expect(normalizedText(page.querySelector('h1'))).toBe(
      'Parlez-nous de votre objectif.',
    );
    expect(normalizedText(page)).toContain('Envoyez votre demande');
    expect(normalizedText(page)).toContain('Nos coordonnées');
    expect(page.querySelector('aside')?.getAttribute('aria-label')).toBe(
      'Informations de contact KRAAK',
    );
    expect(page.querySelector('aside img')?.getAttribute('alt')).toBe(
      "Entretien d'orientation pour clarifier un besoin d'accompagnement",
    );
    expect(normalizedText(page)).toContain(
      'File interne : formation/orientation-public. Workflow : orientation formation sous 48h ouvrées.',
    );
    expect(normalizedText(page)).not.toContain('[missing:web.contact.');
  });

  it('Given the English contact route When every section renders Then visitor copy links and accessible text come from the English catalog', async () => {
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue(
      '/en/contact',
    );
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const content = normalizedText(page);
    const serviceLink = page.querySelector(
      'a[href="/en/services"]',
    ) as HTMLAnchorElement | null;

    expect(normalizedText(page.querySelector('h1'))).toBe(
      'Tell us about your goal.',
    );
    expect(content).toContain('Send an enquiry');
    expect(content).toContain('Give us the right information to guide you.');
    expect(content).toContain('Send your enquiry');
    expect(content).toContain('Project management');
    expect(content).toContain('Our contact details');
    expect(content).toContain('Let’s discuss your next step.');
    expect(serviceLink?.textContent).toContain('Explore our services');
    expect(page.querySelector('aside')?.getAttribute('aria-label')).toBe(
      'KRAAK contact details',
    );
    expect(page.querySelector('aside img')?.getAttribute('alt')).toBe(
      'A guidance meeting to clarify support needs',
    );
    expect(
      page.querySelector('nav[aria-label]')?.getAttribute('aria-label'),
    ).toBe('KRAAK social media');
    expect(page.querySelector('#name')?.getAttribute('placeholder')).toBe(
      'Your name',
    );
    expect(page.querySelector('#country')?.getAttribute('placeholder')).toBe(
      'Your country of residence',
    );
    expect(content).toContain(
      'Internal queue: formation/orientation-public. Workflow: training guidance within 48 business hours.',
    );
    expect(content).not.toContain('Envoyez votre demande');
    expect(content).not.toContain('Nos coordonnées');
    expect(content).not.toContain('[missing:web.contact.');
  });

  it('Given an empty English contact form When it is submitted Then every validation message is shown in English and analytics values stay language-neutral', async () => {
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();

    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    const content = normalizedText(fixture.nativeElement as HTMLElement);

    expect(content).toContain('Name is required.');
    expect(content).toContain('Email address is required.');
    expect(content).toContain('Goal is required.');
    expect(content).toContain('Country is required.');
    expect(content).toContain('Message is required.');
    expect(content).not.toContain('Le nom est requis.');
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'contact_submit_failure',
      expect.objectContaining({
        contact_category: 'training',
        failure_type: 'validation',
        service_type: 'formation',
      }),
    );
  });

  it('Given a valid English contact form When the API accepts it Then the success feedback is displayed in English', async () => {
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.form.setValue({
      name: 'Alice Smith',
      email: 'alice@example.com',
      subject: 'Discuss training support',
      country: 'Ghana',
      serviceType: 'formation',
      message: 'I would like to discuss the right training programme.',
    });

    component.onSubmit();
    const request = httpTestingController.expectOne((candidate) =>
      candidate.url.endsWith('/contact'),
    );

    expect(request.request.body.message).toContain('Country: Ghana');
    expect(request.request.body.message).toContain('Service type: Training');
    expect(request.request.body.message).toContain(
      'Internal queue: formation/orientation-public',
    );
    expect(request.request.body.message).toContain(
      'Response workflow: training guidance within 48 business hours',
    );
    expect(request.request.body.message).toContain(
      'Operational fallback: direct email or WhatsApp',
    );

    request.flush({ success: true, message: 'Request received.' });
    fixture.detectChanges();

    const content = normalizedText(fixture.nativeElement as HTMLElement);

    expect(content).toContain(
      'Your message has been sent. We will get back to you as soon as possible.',
    );
    expect(content).not.toContain('Votre message a bien été envoyé.');
  });

  it('Given a valid English contact form When the API returns French-only details Then localized fallback feedback is shown without leaking French copy', async () => {
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.form.setValue({
      name: 'Alice Smith',
      email: 'alice@example.com',
      subject: 'Discuss project support',
      country: 'Ghana',
      serviceType: 'project',
      message: 'I would like to discuss support for a new project.',
    });

    component.onSubmit();
    httpTestingController
      .expectOne((request) => request.url.endsWith('/contact'))
      .flush(
        {
          errors: [
            "Le formulaire est temporairement indisponible. Veuillez utiliser l'e-mail direct ou WhatsApp indiqué sur la page contact.",
            'Le nom est requis.',
          ],
        },
        { status: 500, statusText: 'Internal Server Error' },
      );
    fixture.detectChanges();

    const content = normalizedText(fixture.nativeElement as HTMLElement);

    expect(content).toContain('Something went wrong. Please try again later.');
    expect(content).toContain(
      'Alternative contact options: you can continue your enquiry without the form.',
    );
    expect(content).not.toContain('Le formulaire est temporairement');
    expect(content).not.toContain('Fallback opérationnel');
    expect(content).not.toContain('Le nom est requis.');
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'contact_submit_failure',
      expect.objectContaining({
        error_count: 2,
        failure_type: 'api',
        status: 500,
      }),
    );
  });

  // Given le formulaire de contact est affiché
  // When l'utilisateur n'a pas encore soumis
  // Then le formulaire avec tous ses champs doit être présent
  it('Given la page de contact When le formulaire est rendu Then tous les champs requis sont presents', () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form');
    expect(form).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#name')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#email')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#subject')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#country')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#serviceType')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#message')).toBeTruthy();
  });

  it('Given la page de contact When le bloc de contact est rendu Then une action WhatsApp visible est présente', () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const whatsappLink = page.querySelector(
      'a[href*="wa.me"]',
    ) as HTMLAnchorElement | null;

    expect(whatsappLink).toBeTruthy();
    expect(whatsappLink?.getAttribute('href')).toBe(WHATSAPP_URL);
  });

  it('Given la page de contact When le lien WhatsApp direct est clique Then un événement WhatsApp public est envoyé', () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const whatsappLink = page.querySelector(
      'a[href*="wa.me"]',
    ) as HTMLAnchorElement;

    dispatchTrackedClick(whatsappLink);

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'whatsapp_click',
      expect.objectContaining({
        contact_surface: 'contact_sidebar',
        link_url: WHATSAPP_URL,
      }),
    );
  });

  it('Given la page de contact When le lien e-mail direct est clique Then un événement e-mail public est envoyé', () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const emailLink = page.querySelector(
      'a[href^="mailto:"]',
    ) as HTMLAnchorElement;

    dispatchTrackedClick(emailLink);

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'direct_email_click',
      expect.objectContaining({
        contact_surface: 'contact_sidebar',
        contact_method: 'email',
      }),
    );
  });

  it('Given la page de contact When les coordonnées sont rendues Then le numéro public utilise un lien tel explicite', () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const phoneLinks = Array.from(
      page.querySelectorAll(`a[href="${CONTACT_PHONE_HREF}"]`),
    ) as HTMLAnchorElement[];

    expect(phoneLinks.length).toBeGreaterThan(0);
    expect(
      phoneLinks.some((link) =>
        link.textContent?.includes(CONTACT_PHONE_DISPLAY),
      ),
    ).toBe(true);
  });

  it('Given la page de contact When le bloc de contact est rendu Then les boutons sociaux sont plus visibles', () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const socialButton = page.querySelector(
      'nav[aria-label="Réseaux sociaux KRAAK"] a[aria-label="Facebook"]',
    ) as HTMLAnchorElement | null;
    const socialIcon = socialButton?.querySelector('i');

    expect(socialButton).toBeTruthy();
    expect(socialButton?.className).toContain('h-12');
    expect(socialButton?.className).toContain('w-12');
    expect(socialIcon?.className).toContain('text-lg');
  });

  it('Given the contact page When it renders Then it does not duplicate the dedicated FAQ route content', () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const faqAccordion = element.querySelector('kraak-faq-accordion');

    expect(faqAccordion).toBeNull();
    expect(element.textContent).not.toContain('Questions fréquentes');
  });

  // Given le formulaire est vide
  // When l'utilisateur soumet le formulaire
  // Then le formulaire doit être invalide et les erreurs affichées
  it('Given un formulaire vide When la soumission est déclenchée Then le formulaire devient invalide', () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.onSubmit();
    fixture.detectChanges();

    expect(component.form.invalid).toBe(true);
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'contact_submit_failure',
      expect.objectContaining({
        failure_type: 'validation',
        route: '/contact',
      }),
    );
  });

  // Given l'état initial
  // When le composant est créé
  // Then le signal de succès doit être false
  it('Given la page de contact When le composant est créé Then le signal success vaut false', () => {
    const fixture = TestBed.createComponent(ContactPage);
    expect(fixture.componentInstance.success()).toBe(false);
  });

  // Given le formulaire de contact
  // When on remplit tous les champs avec des données valides
  // Then le formulaire doit être valide
  it('Given le formulaire de contact When tous les champs valides sont renseignes Then le formulaire devient valide', () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@exemple.com',
      subject: 'Obtenir un accompagnement',
      country: 'C\u00F4te d\u2019Ivoire',
      serviceType: 'formation',
      message: 'Bonjour, je voudrais en savoir plus sur vos programmes.',
    });

    expect(component.form.valid).toBe(true);
  });

  it('Given les catégories publiques When elles sont exposées Then chacune a une file de triage et un workflow', () => {
    const fixture = TestBed.createComponent(ContactPage);
    const component = fixture.componentInstance as unknown as {
      serviceOptions: {
        category: string;
        fallbackWorkflow: string;
        responseWorkflow: string;
        triagePath: string;
        value: string;
      }[];
    };

    expect(component.serviceOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: 'formation',
          category: 'training',
          triagePath: 'formation/orientation-public',
        }),
        expect.objectContaining({
          value: 'project',
          category: 'project_management',
        }),
        expect.objectContaining({
          value: 'immigration',
          category: 'immigration',
        }),
        expect.objectContaining({
          value: 'business',
          category: 'business',
        }),
        expect.objectContaining({
          value: 'program',
          category: 'partnership',
        }),
        expect.objectContaining({
          value: 'other',
          category: 'other',
        }),
      ]),
    );
    expect(
      component.serviceOptions.every(
        (option) =>
          option.triagePath &&
          option.responseWorkflow &&
          option.fallbackWorkflow,
      ),
    ).toBe(true);
  });

  it('Given la page de contact When le type de service est choisi Then le workflow de triage est rendu', () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.form.patchValue({ serviceType: 'immigration' });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('conseil/mobilite-internationale');
    expect(element.textContent).toContain(
      'orientation mobilité sans dépôt de dossier sensible',
    );
  });

  it('Given an unknown service type, When selection fallback is resolved, Then the default other option is used', () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      form: { patchValue: (value: { serviceType: string }) => void };
      getSelectedServiceOption: () => { value: string; category: string };
    };

    component.form.patchValue({ serviceType: 'inexistant' });
    const selected = component.getSelectedServiceOption();

    expect(selected.value).toBe('other');
    expect(selected.category).toBe('other');
  });

  // Given l'\u00E9tat initial de chargement
  // When le composant est créé
  // Then loading doit être false
  it('Given la page de contact When le composant est créé Then le signal loading vaut false', () => {
    const fixture = TestBed.createComponent(ContactPage);
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  // Given un formulaire valide
  // When la soumission API réussit
  // Then le formulaire est réinitialisé et le message de succès est affiché
  it('Given un formulaire valide When la soumission réussit Then un retour de succès est affiché', () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@exemple.com',
      subject: 'Obtenir un accompagnement',
      country: 'C\u00F4te d\u2019Ivoire',
      serviceType: 'formation',
      message: 'Bonjour, je voudrais en savoir plus sur vos programmes.',
    });

    component.onSubmit();

    const request = httpTestingController.expectOne((req) =>
      req.url.endsWith('/contact'),
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toMatchObject({
      category: 'training',
      subject: 'Obtenir un accompagnement',
    });
    expect(request.request.body.message).toContain(
      'Pays : C\u00F4te d\u2019Ivoire',
    );
    expect(request.request.body.message).toContain(
      'Type de service : Formation',
    );
    expect(request.request.body.message).toContain(
      'File interne : formation/orientation-public',
    );
    request.flush({
      success: true,
      message: 'Votre message a bien \u00E9t\u00E9 re\u00E7u.',
    });

    fixture.detectChanges();

    expect(component.success()).toBe(true);
    expect(component.apiErrors()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain(
      'Votre message a bien \u00e9t\u00e9 envoy\u00e9',
    );
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'contact_submit_success',
      {
        contact_category: 'training',
        route: '/contact',
        service_type: 'formation',
      },
    );
  });

  // Given un succès précédent
  // When l'utilisateur soumet à nouveau le formulaire
  // Then success doit repasser à false immédiatement avant la réponse HTTP
  it('Given un succès précédent When une nouvelle soumission commence Then success repasse immédiatement à false', () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    // Première soumission réussie
    component.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@exemple.com',
      subject: 'Obtenir un accompagnement',
      country: 'C\u00F4te d\u2019Ivoire',
      serviceType: 'formation',
      message: 'Bonjour, je voudrais en savoir plus sur vos programmes.',
    });
    component.onSubmit();
    httpTestingController
      .expectOne((req) => req.url.endsWith('/contact'))
      .flush({ success: true, message: 'OK' });
    fixture.detectChanges();
    expect(component.success()).toBe(true);

    // Deuxième soumission : success doit être false immédiatement
    component.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@exemple.com',
      subject: 'Obtenir un accompagnement',
      country: 'C\u00F4te d\u2019Ivoire',
      serviceType: 'formation',
      message: 'Bonjour, je voudrais en savoir plus sur vos programmes.',
    });
    component.onSubmit();
    expect(component.success()).toBe(false);

    // Flush pour ne pas laisser de requêtes en suspens
    httpTestingController
      .expectOne((req) => req.url.endsWith('/contact'))
      .flush({ success: true, message: 'OK' });
  });

  // Given un formulaire valide
  // When l'API répond avec des erreurs de validation
  // Then les erreurs API doivent être affichées dans la page
  it("Given un formulaire valide When l'API renvoie des erreurs de validation Then elles sont affichées dans la page", () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@exemple.com',
      subject: 'Obtenir un accompagnement',
      country: 'C\u00F4te d\u2019Ivoire',
      serviceType: 'formation',
      message: 'Bonjour, je voudrais en savoir plus sur vos programmes.',
    });

    component.onSubmit();

    const request = httpTestingController.expectOne((req) =>
      req.url.endsWith('/contact'),
    );
    request.flush(
      { errors: ['Le nom est requis.', "L'objet est requis."] },
      { status: 400, statusText: 'Bad Request' },
    );

    fixture.detectChanges();

    expect(component.success()).toBe(false);
    expect(component.loading()).toBe(false);
    expect(component.apiErrors()).toEqual([
      'Le nom est requis.',
      "L'objet est requis.",
    ]);
    expect(fixture.nativeElement.textContent).toContain('Le nom est requis.');
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'contact_submit_failure',
      {
        contact_category: 'training',
        error_count: 2,
        failure_type: 'api',
        route: '/contact',
        service_type: 'formation',
        status: 400,
      },
    );
  });

  it("Given l'API indique une panne de livraison When la soumission échoue Then les canaux directs sont affichés", () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@exemple.com',
      subject: 'Obtenir un accompagnement',
      country: 'Côte d’Ivoire',
      serviceType: 'formation',
      message: 'Bonjour, je voudrais en savoir plus sur vos programmes.',
    });

    component.onSubmit();

    const request = httpTestingController.expectOne((req) =>
      req.url.endsWith('/contact'),
    );
    request.flush(
      {
        success: false,
        message:
          "Le formulaire est temporairement indisponible. Veuillez utiliser l'e-mail direct ou WhatsApp indiqué sur la page contact.",
        errors: [
          "Le formulaire est temporairement indisponible. Veuillez utiliser l'e-mail direct ou WhatsApp indiqué sur la page contact.",
        ],
      },
      { status: 500, statusText: 'Internal Server Error' },
    );

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Fallback opérationnel');
    expect(
      element.querySelector('a[href="mailto:kraakconsulting@gmail.com"]'),
    ).toBeTruthy();
    expect(element.querySelector('a[href*="wa.me"]')).toBeTruthy();
  });

  // Given un formulaire valide
  // When l'API répond avec une erreur sans tableau errors structuré
  // Then le message d'erreur générique est affiché
  it("Given un formulaire valide When l'API renvoie une erreur non structurée Then le message générique est affiché", () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@exemple.com',
      subject: 'Obtenir un accompagnement',
      country: 'Côte d\u2019Ivoire',
      serviceType: 'formation',
      message: 'Bonjour, je voudrais en savoir plus sur vos programmes.',
    });

    component.onSubmit();

    const request = httpTestingController.expectOne((req) =>
      req.url.endsWith('/contact'),
    );
    request.flush(
      { message: 'Internal Server Error' },
      { status: 500, statusText: 'Internal Server Error' },
    );

    fixture.detectChanges();

    expect(component.success()).toBe(false);
    expect(component.loading()).toBe(false);
    expect(component.apiErrors()).toEqual([
      'Une erreur est survenue. Veuillez réessayer plus tard.',
    ]);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  // Given un formulaire valide
  // When l'API répond avec une erreur sans tableau errors structuré
  // Then le message d'erreur générique est affiché
  it("Given un formulaire valide When l'API renvoie une réponse sans tableau errors Then le message générique est affiché", () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@exemple.com',
      subject: 'Obtenir un accompagnement',
      country: 'Côte d\u2019Ivoire',
      serviceType: 'formation',
      message: 'Bonjour, je voudrais en savoir plus sur vos programmes.',
    });

    component.onSubmit();

    const request = httpTestingController.expectOne((req) =>
      req.url.endsWith('/contact'),
    );
    request.flush(
      { message: 'Internal Server Error' },
      { status: 500, statusText: 'Internal Server Error' },
    );

    fixture.detectChanges();

    expect(component.success()).toBe(false);
    expect(component.loading()).toBe(false);
    expect(component.apiErrors()).toEqual([
      'Une erreur est survenue. Veuillez réessayer plus tard.',
    ]);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("Given un formulaire valide When l'API renvoie un message texte Then ce message est affiche apres trim", () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@exemple.com',
      subject: 'Obtenir un accompagnement',
      country: 'Côte d’Ivoire',
      serviceType: 'formation',
      message: 'Bonjour, je voudrais en savoir plus sur vos programmes.',
    });

    component.onSubmit();

    const request = httpTestingController.expectOne((req) =>
      req.url.endsWith('/contact'),
    );
    request.flush(
      { message: '  Le service est temporairement indisponible.  ' },
      { status: 500, statusText: 'Internal Server Error' },
    );

    fixture.detectChanges();

    expect(component.success()).toBe(false);
    expect(component.loading()).toBe(false);
    expect(component.apiErrors()).toEqual([
      'Le service est temporairement indisponible.',
    ]);
    expect(fixture.nativeElement.textContent).toContain(
      'Le service est temporairement indisponible.',
    );
  });
});
