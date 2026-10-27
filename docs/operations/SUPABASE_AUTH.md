---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Configuration Supabase Auth

## Table des matières

- [Configuration Supabase Auth](#configuration-supabase-auth)
  - [Source de vérité locale](#source-de-verite-locale)
  - [Variables côté API](#variables-cote-api)
  - [Configuration hébergée à répliquer](#configuration-hebergee-a-repliquer)
  - [Validation minimale](#validation-minimale)
  - [Politique de rate-limit email](#politique-de-rate-limit-email)

Ce runbook décrit la configuration Auth minimale attendue pour le MVP KRAAK.

## Source de vérité locale

Les réglages Auth versionnés dans le dépôt vivent dans :

- `supabase/config.toml`
- `supabase/templates/auth/confirmation.html`
- `supabase/templates/auth/recovery.html`
- `supabase/migrations/20260414000000_auth_setup.sql`

Ce socle couvre :

- provider email/password activé
- confirmations email activées
- URLs de redirection web/mobile du MVP
- templates email locaux pour confirmation et récupération
- bootstrap automatique de `public.app_user` depuis `auth.users`
- compatibilité avec les endpoints `auth/*` de l'API NestJS

## Variables côté API

Pour les endpoints `auth/*` ajoutés dans `AUT-02`, l'API lit :

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_PUBLISHABLE_KEY` quand elle est disponible

La clé publishable est recommandée pour les flux `sign-in`, `sign-up`,
`refresh`, `password-reset` et `session`. En fallback, l'API peut utiliser
`SUPABASE_SECRET_KEY`, mais le comportement cible reste de garder un client auth
éphémère distinct du client admin.

## Configuration hébergée à répliquer

Pour le projet Supabase de production, vérifier dans le Dashboard :

1. Provider `Email` activé
2. Signups email autorisés
3. Confirmation email activée
4. `Site URL` alignée avec la surface web principale
5. Redirect URLs alignées avec web, mobile et deep links KRAAK

Autoriser uniquement les callbacks du site de production effectivement validé
et des applications mobiles autorisées. Les URL Render ci-dessous sont la cible
de configuration, pas une preuve de disponibilité. Ne pas recopier des
redirections de staging ou de localhost en production :

- `https://kraak-web-prod.onrender.com/auth/callback`
- `https://kraak-web-prod.onrender.com/auth/reset`

Le développement utilise Supabase local et les redirections suivantes :

- `http://localhost:4200/auth/callback`
- `http://localhost:4200/auth/reset`
- `http://localhost:4300/auth/callback`
- `http://localhost:4300/auth/reset`
- `kraak://auth/callback`
- `kraak://auth/reset`

## Validation minimale

Avant de considérer `AUT-01` comme prêt :

1. Le provider email/password est activé localement via `supabase/config.toml`
2. Un signup local crée bien une entrée `public.app_user`
3. Les templates de confirmation et de récupération utilisent un lien Supabase valide
4. Les politiques RLS de base du schéma initial restent actives

Les tables sensibles du socle `app_user`, `participant`, `support_request`,
`session`, `announcement`, `cohort`, `enrollment`, `notification`, `program`
et `resource` utilisent maintenant une policy permissive unique par action
(`SELECT`, `INSERT`, `UPDATE`, `DELETE`) pour supprimer les warnings
`multiple_permissive_policies` du linter Supabase tout en conservant les droits
admin, formateur, utilisateur et lecture publique attendus.

## Politique de rate-limit email

Les essais de confirmation et récupération utilisent la messagerie locale.
Ne pas envoyer de messages non sollicités ni augmenter les quotas de production
pour faire passer des tests.

La configuration locale historique prévoit :

- `auth.email.max_frequency = "30s"` (cooldown par utilisateur)
- `auth.rate_limit.email_sent = 30` (quota global par heure)

Important : sur un projet Supabase hébergé avec le provider email natif,
le quota global d'emails reste plafonné à 2/h. Pour appliquer un quota plus
élevé en production, une configuration SMTP approuvée et testée est nécessaire.

Vérifier les callbacks, le domaine d'envoi, les quotas anti-abus et la réception
avec un compte de test autorisé avant d'activer le parcours réel.
L'état Auth de production et ses blocages sont documentés dans le
[registre de transition](PRODUCTION_ONLY_TRANSITION.md).
