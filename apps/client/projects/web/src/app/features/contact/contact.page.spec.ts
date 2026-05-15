import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { vi } from 'vitest';
import { KRAAK_SOCIAL_LINKS } from '../../shared/brand/brand-constants';

import ContactPage from './contact.page';

const WHATSAPP_URL =
  KRAAK_SOCIAL_LINKS.find((socialLink) => socialLink.label === 'WhatsApp')
    ?.href ?? '';

describe('ContactPage', () => {
  let httpTestingController: HttpTestingController;
  let messageService: MessageService;
  let messageServiceAddSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
      ],
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    messageService = TestBed.inject(MessageService);
    messageServiceAddSpy = vi.spyOn(messageService, 'add');
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
  it('Given la page de contact When le composant est instancie Then il se cree sans erreur', () => {
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

  // Given le formulaire de contact est affich\u00E9
  // When l'utilisateur n'a pas encore soumis
  // Then le formulaire avec tous ses champs doit \u00EAtre pr\u00E9sent
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

  it('Given la page de contact When le bloc de contact est rendu Then une action WhatsApp visible est presente', () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const whatsappLink = page.querySelector(
      'a[href*="wa.me"]',
    ) as HTMLAnchorElement | null;

    expect(whatsappLink).toBeTruthy();
    expect(whatsappLink?.getAttribute('href')).toBe(WHATSAPP_URL);
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
    expect(element.textContent).not.toContain('Questions fr\u00E9quentes');
  });

  // Given le formulaire est vide
  // When l'utilisateur soumet le formulaire
  // Then le formulaire doit \u00EAtre invalide et les erreurs affich\u00E9es
  it('Given un formulaire vide When la soumission est declenchee Then le formulaire devient invalide', () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.onSubmit();
    fixture.detectChanges();

    expect(component.form.invalid).toBe(true);
  });

  // Given l'état initial
  // When le composant est créé
  // Then le signal de succès doit être false
  it('Given la page de contact When le composant est cree Then le signal success vaut false', () => {
    const fixture = TestBed.createComponent(ContactPage);
    expect(fixture.componentInstance.success()).toBe(false);
  });

  // Given le formulaire de contact
  // When on remplit tous les champs avec des donn\u00E9es valides
  // Then le formulaire doit \u00EAtre valide
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

  // Given l'\u00E9tat initial de chargement
  // When le composant est cr\u00E9\u00E9
  // Then loading doit \u00EAtre false
  it('Given la page de contact When le composant est cree Then le signal loading vaut false', () => {
    const fixture = TestBed.createComponent(ContactPage);
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  // Given un formulaire valide
  // When la soumission API réussit
  // Then le formulaire est réinitialisé et le message de succès est affiché
  it('Given un formulaire valide When la soumission reussit Then un retour de succes est affiche', () => {
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
      category: 'program',
      subject: 'Obtenir un accompagnement',
    });
    expect(request.request.body.message).toContain(
      'Pays : C\u00F4te d\u2019Ivoire',
    );
    expect(request.request.body.message).toContain(
      'Type de service : Formation',
    );
    request.flush({
      success: true,
      message: 'Votre message a bien \u00E9t\u00E9 re\u00E7u.',
    });

    fixture.detectChanges();

    expect(component.success()).toBe(true);
    expect(component.apiErrors()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(messageServiceAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'app-feedback',
        severity: 'success',
        summary: 'Contact',
      }),
    );
  });

  // Given un succès précédent
  // When l'utilisateur soumet à nouveau le formulaire
  // Then success doit repasser à false immédiatement avant la réponse HTTP
  it('Given un succes precedent When une nouvelle soumission commence Then success repasse immediatement a false', () => {
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
  it("Given un formulaire valide When l'API renvoie des erreurs de validation Then elles sont affichees dans la page", () => {
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
  });

  // Given un formulaire valide
  // When l'API répond avec une erreur sans tableau errors structuré
  // Then le message d'erreur générique est affiché
  it("Given un formulaire valide When l'API renvoie une erreur non structuree Then le message generique est affiche", () => {
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
    expect(messageServiceAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'app-feedback',
        severity: 'error',
        summary: 'Contact',
      }),
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
