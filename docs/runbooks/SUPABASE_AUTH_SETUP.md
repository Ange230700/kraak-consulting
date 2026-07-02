# Configuration Supabase Auth

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

Pour un projet Supabase staging ou production, répliquer au minimum dans le Dashboard :

1. Provider `Email` activé
2. Signups email autorisés
3. Confirmation email activée
4. `Site URL` alignée avec la surface web principale
5. Redirect URLs alignées avec web, mobile et deep links KRAAK

URLs minimales à autoriser :

- `https://kraak-web-prod.onrender.com/auth/callback`
- `https://kraak-web-prod.onrender.com/auth/reset`
- `https://kraak-web-staging.onrender.com/auth/callback`
- `https://kraak-web-staging.onrender.com/auth/reset`
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

## Politique de rate-limit email (staging)

Objectif staging : éviter les blocages du flux mot de passe oublié pendant les
tests, tout en gardant une protection anti-abus minimale.

Politique cible :

- `auth.email.max_frequency = "30s"` (cooldown par utilisateur)
- `auth.rate_limit.email_sent = 30` (quota global par heure)

Important : sur un projet Supabase hébergé avec le provider email natif,
le quota global d'emails reste plafonné à 2/h. Pour appliquer un quota plus
élevé en staging, il faut configurer un SMTP personnalisé.

Application sur staging (Dashboard) :

1. Ouvrir `Authentication > SMTP Settings` et activer un SMTP personnalisé.
2. Ouvrir `Authentication > Rate Limits`.
3. Définir le cooldown email utilisateur à `30s`.
4. Définir `Emails sent` à `30` par heure.
5. Sauvegarder puis attendre la propagation (quelques secondes).

Application sur staging (Management API) :

1. Récupérer un token personnel Supabase (Dashboard account tokens).
2. Exécuter un `PATCH /v1/projects/{project_ref}/config/auth` avec
   `rate_limit_email_sent: 30` et `smtp_max_frequency: 30`.

Exemple :

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "rate_limit_email_sent": 30,
    "smtp_max_frequency": 30
  }'
```

Vérification recommandée :

1. Faire deux demandes de réinitialisation à plus de 30s d'intervalle.
2. Vérifier que l'API KRAAK ne remonte plus de `429 over_email_send_rate_limit`
   dans ce volume nominal de test.
