# Événements analytics publics

Ce runbook documente les événements publics envoyés à GA4 lorsque
`PUBLIC_GA4_ID` est configuré. Les payloads ne doivent pas contenir de nom,
d'adresse e-mail, de numéro de téléphone, de message libre, ni de donnée de
dossier.

## Événements suivis

| Événement                | Déclencheur                                      | Paramètres utiles                                                                    |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `page_view`              | Navigation publique terminée                     | `page_path`                                                                          |
| `conversion_cta_click`   | Clic sur un composant `kraak-cta-banner`         | `cta_context`, `cta_label`, `cta_link`                                               |
| `nav_cta_click`          | Clic sur un lien de navigation principale        | `nav_label`, `nav_path`, `nav_surface`                                               |
| `contact_submit_success` | Soumission réussie du formulaire de contact      | `route`, `service_type`, `contact_category`                                          |
| `contact_submit_failure` | Formulaire invalide ou erreur API de contact     | `route`, `service_type`, `contact_category`, `failure_type`, `status`, `error_count` |
| `whatsapp_click`         | Clic vers WhatsApp depuis les surfaces publiques | `contact_method`, `contact_surface`, `link_url`, `link_label`                        |
| `direct_email_click`     | Clic sur un lien e-mail public                   | `contact_method`, `contact_surface`, `link_url`                                      |

## Surfaces publiques

- `primary_nav` : navigation principale du site.
- `contact_sidebar`, `contact_form_secondary_cta`, `contact_coordinates`,
  `contact_social` : page contact.
- `footer_social` : réseaux sociaux du pied de page.
- `legal_mentions`, `privacy_controller`, `privacy_rights` : pages légales et
  confidentialité.

## Règles de maintenance

- Ajouter les nouveaux clics publics via
  `PublicConversionTrackingDirective` plutôt qu'avec un appel GA4 direct.
- Utiliser `AnalyticsService.trackEvent` directement pour les événements liés à
  un résultat métier, par exemple succès ou échec de formulaire.
- Ne jamais envoyer de donnée personnelle dans les paramètres GA4.
