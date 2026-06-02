# Modèle de commentaire d'incident — rotation secrets Supabase + Render

Copier-coller ce bloc dans un ticket ou un commentaire d'incident pour suivre
une rotation manuelle des secrets Supabase et la finalisation Render associée.

```text
## Incident — rotation secrets Supabase + finalisation Render

Date: YYYY-MM-DD
Opérateur: @Ange230700
Dépôt: Ange230700/kraak-consulting

### Supabase

Supabase dashboard > projet > Settings > API Keys

[ ] Staging (`kraak` / `qgttdsnupelohowwkkwb`)
[ ] Créer une nouvelle Secret key
[ ] Remplacer `SUPABASE_SECRET_KEY` dans `apps/api/.env`, `apps/api/.env.staging`, Render staging, secrets CI si présents
[ ] Vérifier `SUPABASE_URL=https://qgttdsnupelohowwkkwb.supabase.co` + cohérence avec `SUPABASE_PUBLISHABLE_KEY`
[ ] Vérifier l'API staging + logs
[ ] Supprimer l'ancienne Secret key compromise

[ ] Production (`kraak-prod` / `pwuivkqnmjpxxpppmnvu`)
[ ] Créer une nouvelle Secret key
[ ] Remplacer `SUPABASE_SECRET_KEY` dans `apps/api/.env.prod`, Render prod, secrets CI prod si présents
[ ] Vérifier `SUPABASE_URL=https://pwuivkqnmjpxxpppmnvu.supabase.co` + cohérence avec `SUPABASE_PUBLISHABLE_KEY`
[ ] Vérifier l'API prod + logs
[ ] Supprimer l'ancienne Secret key compromise

[ ] Ne pas faire tourner `sb_publishable_*` sauf décision explicite d'incident plus large

### Render

Render dashboard > service > Environment > Environment Variables

[ ] API staging (`kraak-api-staging`)
[ ] Vérifier / remplacer : SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY, RESEND_API_KEY, CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, CORS_ALLOWED_ORIGINS, CORS_ALLOWED_ORIGIN_PATTERNS
[ ] Save and deploy
[ ] Vérifier https://kraak-api-staging.onrender.com/health + logs

[ ] Web staging (`kraak-web-staging`) si impact front
[ ] Vérifier / remplacer : CLIENT_API_BASE_URL, CLIENT_FEATURE_PARTICIPANT_AREA, CLIENT_SITE_URL
[ ] Save, rebuild, and deploy
[ ] Vérifier la home + appels API

[ ] API prod (`kraak-api-prod`)
[ ] Vérifier / remplacer : SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY, RESEND_API_KEY, CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, CORS_ALLOWED_ORIGINS, CORS_ALLOWED_ORIGIN_PATTERNS
[ ] Save and deploy
[ ] Vérifier https://kraak-api-prod.onrender.com/health + logs

[ ] Web prod (`kraak-web-prod`) si impact front
[ ] Vérifier / remplacer : CLIENT_API_BASE_URL, CLIENT_FEATURE_PARTICIPANT_AREA, CLIENT_SITE_URL
[ ] Save, rebuild, and deploy
[ ] Vérifier la home + appels API

### Résultat

[ ] Rotation staging terminée
[ ] Rotation production terminée
[ ] Render staging finalisé
[ ] Render production finalisé
[ ] Anciennes Secret keys Supabase révoquées
[ ] Vérifications `/health` et logs OK

### Références

- Supabase : `docs/runbooks/SUPABASE_SECRET_ROTATION.md`
- Render : `docs/runbooks/RENDER_ENV_FINALIZATION.md`

## Post-mortem court
Cause:
- <cause racine confirmée ou hypothèse la plus probable>
Impact:
- <services touchés>
- <utilisateurs / flux touchés>
Fenêtre:
- Début: YYYY-MM-DD HH:MM TZ
- Fin: YYYY-MM-DD HH:MM TZ
Actions restantes:
- [ ] <action 1>
- [ ] <action 2>
- [ ] <action 3>
```
