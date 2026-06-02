# Rotation des clés Supabase

Ce runbook décrit la procédure de finalisation manuelle dans le dashboard
Supabase quand une `sb_secret_*` a été exposée localement.

Contexte KRAAK au 2 juin 2026 :

- staging : projet `kraak` (`qgttdsnupelohowwkkwb`)
- production : projet `kraak-prod` (`pwuivkqnmjpxxpppmnvu`)

## Ce qui doit être tourné

À faire immédiatement :

1. créer une nouvelle `secret key` sur chaque projet
2. remplacer la valeur dans les environnements qui l'utilisent
3. supprimer l'ancienne `secret key` en la marquant compromise

À ne pas traiter comme incident prioritaire :

- `sb_publishable_*` : clé publique, conçue pour être exposée côté client
- `anon` : clé legacy publique, à surveiller mais pas prioritaire dans ce cas

## Préparation

Avant d'ouvrir le dashboard, préparer ces emplacements de remplacement :

- local API : `apps/api/.env`
- local staging : `apps/api/.env.staging`
- local production : `apps/api/.env.prod`
- Render staging : variables du service API staging
- Render production : variables du service API production
- GitHub Actions / environnements si une `SUPABASE_SECRET_KEY` y existe

Ne supprimer aucune ancienne clé avant d'avoir propagé la nouvelle partout.

## Version ultra courte pour ticket d'incident

Version fusionnée avec Render disponible dans
[`INCIDENT_SECRET_ROTATION_COMMENT_TEMPLATE.md`](INCIDENT_SECRET_ROTATION_COMMENT_TEMPLATE.md).

```text
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
```

## Staging

### 1. Créer la nouvelle clé secrète staging

1. Ouvrir le dashboard Supabase.
2. Sélectionner le projet `kraak`.
3. Aller dans `Settings` > `API Keys`.
4. Dans la section des clés modernes, créer une nouvelle clé de type `Secret`.
5. Nom conseillé : `kraak-staging-2026-06-02-rotation`.
6. Copier immédiatement la valeur complète, visible une seule fois.

### 2. Remplacer la clé dans les cibles staging

Remplacer `SUPABASE_SECRET_KEY` dans :

1. `apps/api/.env`
2. `apps/api/.env.staging`
3. le service Render API staging
4. tout secret GitHub ou workflow qui consomme la clé staging

Valeurs associées à vérifier sans les changer sauf besoin :

- `SUPABASE_URL=https://qgttdsnupelohowwkkwb.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`

### 3. Vérifier staging avant suppression

Contrôles minimaux :

1. l'API staging démarre avec la nouvelle clé
2. un endpoint backend qui lit Supabase répond correctement
3. aucun log Render ne montre `401`, `403` ou `Invalid API key`

### 4. Révoquer l'ancienne clé staging

1. Revenir dans `Settings` > `API Keys` du projet `kraak`.
2. Identifier l'ancienne `secret key` par son préfixe.
3. Supprimer la clé.
4. Si le dashboard le propose, renseigner que la clé a été compromise.
5. Confirmer la suppression.

## Production

### 1. Créer la nouvelle clé secrète production

1. Ouvrir le projet `kraak-prod`.
2. Aller dans `Settings` > `API Keys`.
3. Créer une nouvelle clé `Secret`.
4. Nom conseillé : `kraak-production-2026-06-02-rotation`.
5. Copier immédiatement la valeur complète.

### 2. Remplacer la clé dans les cibles production

Remplacer `SUPABASE_SECRET_KEY` dans :

1. `apps/api/.env.prod`
2. le service Render API production
3. les secrets GitHub / environnements de release production si présents

Valeurs associées à vérifier sans les changer sauf besoin :

- `SUPABASE_URL=https://pwuivkqnmjpxxpppmnvu.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`

### 3. Vérifier production avant suppression

Contrôles minimaux :

1. l'API production démarre avec la nouvelle clé
2. le ou les endpoints backend branchés sur Supabase restent opérationnels
3. aucun log Render ne montre d'erreur d'auth Supabase

### 4. Révoquer l'ancienne clé production

1. Revenir dans `Settings` > `API Keys` du projet `kraak-prod`.
2. Identifier l'ancienne `secret key` par son préfixe.
3. Supprimer la clé.
4. Si disponible, la marquer compromise.
5. Confirmer.

## Vérification finale

Après les deux rotations :

1. confirmer que les anciennes clés n'existent plus dans `Settings` > `API Keys`
2. confirmer que les fichiers locaux n'ont plus l'ancienne valeur
3. confirmer que Render staging et production portent la nouvelle valeur
4. relancer une vérification backend simple sur staging puis production
5. surveiller les logs Supabase et Render pendant quelques minutes

## Check-list exécutable

### Check-list staging

- [ ] Nouvelle `secret key` créée sur `kraak`
- [ ] `apps/api/.env` mis à jour
- [ ] `apps/api/.env.staging` mis à jour
- [ ] Render staging mis à jour
- [ ] Secrets CI staging mis à jour si présents
- [ ] Vérification fonctionnelle OK
- [ ] Ancienne clé supprimée

### Check-list production

- [ ] Nouvelle `secret key` créée sur `kraak-prod`
- [ ] `apps/api/.env.prod` mis à jour
- [ ] Render production mis à jour
- [ ] Secrets CI production mis à jour si présents
- [ ] Vérification fonctionnelle OK
- [ ] Ancienne clé supprimée

## Après action

Documenter dans le ticket ou le journal d'incident :

1. les préfixes des anciennes clés révoquées
2. la date et l'heure de rotation
3. les systèmes mis à jour
4. le résultat des vérifications staging et production

Ne jamais consigner la valeur complète d'une clé dans le dépôt, un ticket, ou un
message de chat.
