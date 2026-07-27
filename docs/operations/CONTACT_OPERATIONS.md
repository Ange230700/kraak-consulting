---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Opérations de contact public

## Table des matières

- [Opérations de contact public](#operations-de-contact-public)
  - [Files de triage](#files-de-triage)
  - [Comportement système](#comportement-systeme)
  - [Maintenance](#maintenance)

Ce runbook décrit le triage des demandes publiques envoyées depuis `/contact`.
Il complète la politique publique de réponse sous 48h ouvrées et le fallback par
e-mail direct ou WhatsApp.

## Files de triage

| Catégorie API        | Choix public           | File interne                                | Workflow de réponse                                                                                                  | Fallback                                                         |
| -------------------- | ---------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `training`           | Formation              | `formation/orientation-public`              | Qualifier le public, le besoin de formation et proposer une orientation sous 48h ouvrées.                            | E-mail direct ou WhatsApp depuis la page contact.                |
| `project_management` | Gestion de projets     | `conseil/gestion-de-projets`                | Qualifier le contexte, les parties prenantes et proposer un cadrage sous 48h ouvrées.                                | E-mail direct ou WhatsApp.                                       |
| `immigration`        | Conseil en immigration | `conseil/mobilite-internationale`           | Qualifier le pays, l'objectif de mobilité et le stade du dossier sans demander de pièces sensibles via le site.      | WhatsApp ou e-mail direct, sans dossier complet en pièce jointe. |
| `business`           | Solutions entreprises  | `partenariats/organisations-et-entreprises` | Identifier l'organisation, le besoin collectif et le décideur, puis proposer un échange de cadrage sous 48h ouvrées. | E-mail direct.                                                   |
| `partnership`        | Partenariat            | `partenariats/institutionnel`               | Qualifier la nature du partenariat, l'impact attendu et le calendrier de décision sous 48h ouvrées.                  | E-mail direct ou WhatsApp.                                       |
| `program`            | Programme participant  | `programmes/catalogue-et-admission`         | Identifier le programme visé, l'éligibilité et la prochaine orientation disponible sous 48h ouvrées.                 | Ticket authentifié ou contact direct public.                     |
| `session`            | Session ou cohorte     | `programmes/sessions-et-cohortes`           | Vérifier la session, le calendrier ou la cohorte concernée puis répondre sous 48h ouvrées.                           | Ticket authentifié ou contact direct public.                     |
| `billing`            | Facturation            | `administration/facturation`                | Qualifier la demande administrative ou financière et répondre sous 48h ouvrées.                                      | Ticket authentifié ou contact direct, sans données sensibles.    |
| `technical`          | Support technique      | `ops-digital/support-technique`             | Qualifier le blocage, vérifier le canal concerné et répondre sous 48h ouvrées.                                       | Ticket authentifié ou contact direct public.                     |
| `other`              | Autre demande          | `intake/general`                            | Lire la demande, choisir la file interne adaptée et répondre ou réorienter sous 48h ouvrées.                         | E-mail direct ou WhatsApp.                                       |

## Comportement système

- Le frontend envoie une catégorie API explicite pour chaque choix public et
  ajoute la file interne, le workflow et le fallback dans le message transmis.
- L'API enrichit chaque e-mail de notification avec la file interne, le workflow
  de réponse et le fallback opérationnel.
- Si Resend ou la configuration e-mail est indisponible pour une demande
  anonyme, l'API renvoie une erreur exploitable et le frontend affiche l'e-mail
  public et WhatsApp comme fallback immédiat.
- Si une demande authentifiée est déjà stockée dans `support_request`, ce ticket
  devient le fallback interne quand l'e-mail de notification échoue.
- Les messages publics ne doivent jamais demander de pièces d'identité, de
  justificatifs financiers ou de dossier sensible complet via le formulaire.

## Maintenance

- Ajouter toute nouvelle catégorie dans `SupportCategory`, les schémas
  `@kraak/contracts`, `support.dto.ts`, `contact-triage.config.ts` et la
  migration Supabase correspondante.
- Mettre à jour cette page, les tests API et les tests du formulaire contact
  dans le même changement.
- Garder les payloads analytics sans donnée personnelle : catégorie, route,
  statut et type d'échec suffisent.
