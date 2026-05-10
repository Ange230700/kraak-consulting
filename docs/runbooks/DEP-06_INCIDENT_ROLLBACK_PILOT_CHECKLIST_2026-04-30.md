# DEP-06 - Runbook incident + rollback + pilot checklist

Date: 2026-04-30  
Issue: #123  
Epic: DEP

## Objectif

Fournir des procédures opérationnelles pour :

1. **Incident response** : diagnostic et mitigation rapide d'une dégradation de service
2. **Rollback** : revert sûr vers une version précédente (API via Render, web via Vercel)
3. **Pilot launch checklist** : vérification complète avant le déploiement pilot

## Dépendances

- `DEP-01` : Configuration des environnements dev/staging/pilot satisfaite
  - environnements configurés : local, staging, production-pilot
  - URLs de déploiement documentées et stables
- `DEP-05` : Observabilité et alerting minimum satisfait
  - `GET /health` enrichi de métadonnées d'exploitation
  - workflow GitHub Actions `Observability` lancé toutes les 15 minutes
  - alerte GitHub ouverte/fermée automatiquement en cas d'indisponibilité
- `QAT-06` : Checks accessibilité/performance pré-pilot satisfaits
  - checks web sur routes critiques exécutés et verts
  - aucun écart `critical` ou `serious` détecté

## Portée DEP-06

Cette tâche couvre :

- procédures de diagnostic et d'incident sur les services web et API pilot
- procédures de rollback sûres pour Vercel (web) et Render (API)
- checklist exhaustive de validation avant ouverture pilot
- playbooks de réponse d'urgence

Cette tâche ne couvre pas :

- paging temps réel ou systèmes d'escalade complexes
- automatisation de rollback (procédures manuelles retenues pour la sécurité)
- orchestration multi-région ou failover automatique
- SLA ou contrats de niveau de service

---

## 1. Incident Response Playbook

### 1.1 Détection d'incident

#### Signaux de monitorage

Les incidents sont détectés via :

1. **Workflow `Observability`** (toutes les 15 minutes)
   - vérification `GET https://kraak-consulting.vercel.app` (web home)
   - vérification `GET https://kraak-api-staging.onrender.com/health` (API health)
   - en cas d'échec, issue GitHub `[ALERT][DEP-05] Observability check failure`
   - chaque échec crée un commentaire horodate

2. **Alertes manuelles**
   - utilisateurs rapportent une indisponibilité
   - erreurs dans le support ou formulaire de contact

3. **GitHub Issues**
   - vérifier le label `[ALERT]` dans les issues récentes
   - chercher les issues fermées soudainement réouvertes

#### Escalade urgente

Si l'issue d'alerte Observability n'est pas fermée au-delà de **15 minutes** :

1. **Vérifier manuellement** :

   ```bash
   # Web
   curl -v https://kraak-consulting.vercel.app

   # API
   curl -v https://kraak-api-staging.onrender.com/health
   ```

2. **Vérifier les logs déploiement** :
   - Vercel : https://vercel.com/dashboard/kraak-group (Events + Deployments)
   - Render : https://dashboard.render.com (Web Service: kraak-api)

3. **Notifier l'équipe** si incident confirmé (non-résolution = escalade)

### 1.2 Diagnostic d'incident

#### Phase 1 : Isoler le domaine

| Symptôme                               | Domaine probable | Action urgente                             |
| -------------------------------------- | ---------------- | ------------------------------------------ |
| Web inaccessible (500, timeout)        | Vercel           | Vérifier Vercel dashboard & derniers logs  |
| API `/health` échoue                   | Render           | Vérifier Render dashboard & logs conteneur |
| API slow, latence élevée               | Render / DB      | Vérifier `GET /health` pour uptime/perf    |
| Certains endpoints 5xx, autres 200 ok  | API route        | Chercher la route en erreur dans logs API  |
| Web accède à l'API mais erreurs métier | API logic        | Vérifier les logs applicatifs coté API     |
| Données manquantes ou incohérentes     | Supabase         | Vérifier le statut Supabase dashboard      |

#### Phase 2 : Collecte de données

**Web (Vercel)**

```bash
# 1. Derniers deployments
curl -s https://api.vercel.com/v6/deployments?teamId=TEAM_ID \
  -H "Authorization: Bearer $VERCEL_TOKEN" | jq '.deployments[0:5]'

# 2. Logs derniers déploiements
# Via dashboard: https://vercel.com/dashboard/kraak-group > Deployments > Recent

# 3. Vérifier health via headers HTTP
curl -i https://kraak-consulting.vercel.app
```

**API (Render)**

```bash
# 1. Vérifier le statut du service
curl -v https://kraak-api-staging.onrender.com/health

# 2. Accéder aux logs
# Via dashboard: https://dashboard.render.com > Web Services > kraak-api > Logs

# 3. Vérifier uptime du service
# Via dashboard: https://dashboard.render.com > Web Services > kraak-api > Analytics
```

**Supabase**

```bash
# 1. Vérifier l'état global
# Via: https://supabase.com/dashboard > Status

# 2. Vérifier les connexions actives
# Via: https://supabase.com/dashboard > Settings > Database

# 3. Chercher les erreurs récentes
# Via: https://supabase.com/dashboard > SQL Editor > logs du projet
```

### 1.3 Mitigation immédiate

#### Scénario A : Web indisponible, API OK

```
Action 1 : Vérifier le dernier déploiement web
- URL: https://vercel.com/dashboard/kraak-group
- Chercher la dernière fonction/build échouée
- Chercher les variables d'environnement manquantes

Action 2 : Redéployer depuis main manuellement
- Pousser un petit commit de "bump" (ex: changement inoffensif)
- Ou utiliser Vercel UI > Deployments > Redeploy
- Attendre ~60s et vérifier avec: curl -v https://kraak-consulting.vercel.app

Action 3 : Si le problème persiste
- Procéder à un ROLLBACK (voir section 2)
```

#### Scénario B : API indisponible, Web OK (error 500/timeout)

```
Action 1 : Vérifier les logs Render
- URL: https://dashboard.render.com > kraak-api > Logs
- Chercher les erreurs d'initialisation (DB, variables d'env)
- Chercher les crashs de process

Action 2 : Vérifier les variables d'environnement
- URL: https://dashboard.render.com > kraak-api > Environment
- Confirmer que toutes les clés requises sont présentes
- Vérifier la syntaxe des URLs (http://, https://, etc.)

Action 3 : Redémarrer le service depuis Render UI
- URL: https://dashboard.render.com > kraak-api > Settings > Restart
- Attendre ~30s pour démarrage du conteneur
- Vérifier: curl https://kraak-api-staging.onrender.com/health

Action 4 : Si le problème persiste
- Procéder à un ROLLBACK (voir section 2)
```

#### Scénario C : Lenteur généralisée (API/Web lents)

```
Action 1 : Vérifier les ressources Render
- URL: https://dashboard.render.com > kraak-api > Analytics
- Chercher un pic de CPU ou mémoire
- Chercher un saturement de connexions Supabase

Action 2 : Vérifier Supabase
- URL: https://supabase.com/dashboard > Status (global)
- URL: https://supabase.com/dashboard > Settings > Database (connexions)
- Chercher un incident signalé

Action 3 : Si Supabase est saturé
- Attendre la récupération naturelle (DB timeout autolimitant)
- Ou limiter le trafic côté API en temporaire avec un redirect vers une page maintenace

Action 4 : Redémarrer le service API
- URL: https://dashboard.render.com > kraak-api > Settings > Restart
- Attendre 30s et vérifier la latence
```

#### Scénario D : Erreurs spécifiques par route (ex: `/programs` en 500, `/` en 200)

```
Action 1 : Identifier la route défaillante depuis les logs Web
- URL: https://vercel.com/dashboard > Logs (Function Logs)
- Chercher les GET /programs (ou la route en erreur)
- Lire le message d'erreur

Action 2 : Vérifier les logs API correspondants
- URL: https://dashboard.render.com > kraak-api > Logs
- Chercher le traceback de l'erreur
- Identifier si c'est une erreur applicative ou une erreur BD

Action 3 : Si c'est une erreur applicative
- Procéder à un ROLLBACK (voir section 2)
- Ensuite, pousser un correctif et redéployer

Action 4 : Si c'est une erreur BD (ex: table manquante)
- Vérifier si une migration est manquante
- Exécuter les migrations Supabase si nécessaire
```

### 1.4 Post-incident

1. **Fermer l'issue d'alerte** (le workflow Observability le fera automatiquement au prochain check vert)
2. **Documenter l'incident** :
   - créer une issue GitHub `[POSTMORTEM] <titre de l'incident>`
   - énumérer les étapes de diagnostic
   - documenter la cause racine
   - lister les actions préventives
3. **Améliorer les alertes** si nécessaire
4. **Planifier un fix** si une correction applicative est nécessaire

---

## 2. Rollback Procedures

### 2.1 Rollback Web (Vercel)

**Prérequis** :

- Accès dashboard Vercel (https://vercel.com)
- Accès repo GitHub avec droits push

#### Méthode A : Redeploy depuis l'UI Vercel (rapide)

1. Aller sur https://vercel.com/dashboard/kraak-group
2. Cliquer sur le projet `kraak-group`
3. Aller dans l'onglet **Deployments**
4. Trouver le déploiement stable précédent (chercher la date/heure)
5. Cliquer sur le bouton `...` (menu)
6. Sélectionner **Promote to Production**
7. Confirmer
8. Attendre ~60 secondes
9. Vérifier : `curl -v https://kraak-consulting.vercel.app`

**Durée** : ~2 minutes  
**Risque** : bas (même artefact, juste serveur mis à jour)

#### Méthode B : Redeploy depuis Git (fiable)

1. Identifier le dernier commit stable : `git log --oneline -10`
2. Revert vers ce commit : `git revert -n <commit_sha>` OU `git reset --hard <commit_sha>`
3. Créer une branche rollback : `git checkout -b fix/rollback-<yyyymmdd-hhmm>`
4. Commiter le revert : `git commit -m "fix: rollback to <commit_sha> due to <incident>"`
5. Pousser : `git push origin fix/rollback-<yyyymmdd-hhmm>`
6. Créer une PR, reviewer, merger vers `main`
7. Vercel redéploie automatiquement
8. Attendre ~60 secondes
9. Vérifier : `curl -v https://kraak-consulting.vercel.app`

**Durée** : ~5 minutes (incluant build)  
**Risque** : très bas (tracé Git clair)

#### Méthode C : Rollback complet depuis une étiquette (sûr)

Utile si vous avez taggé des releases :

```bash
# 1. Créer une branche depuis le tag stable
git checkout -b fix/rollback-from-<tag> <tag>

# 2. Commiter en revert
git commit --allow-empty -m "fix: rollback to tag <tag> due to <incident>"

# 3. Pousser et laisser Vercel redéployer
git push origin fix/rollback-from-<tag>

# 4. Merger dans main une fois vérifiée
```

### 2.2 Rollback API (Render)

**Prérequis** :

- Accès dashboard Render (https://dashboard.render.com)
- Accès repo GitHub avec droits push

#### Méthode A : Redeploy un commit précédent depuis Render UI

1. Aller sur https://dashboard.render.com > Web Services > kraak-api
2. Cliquer sur l'onglet **Deployments**
3. Trouver le déploiement stable précédent (chercher la date/heure)
4. Cliquer sur le déploiement
5. Cliquer sur le bouton **Redeploy**
6. Confirmer
7. Attendre le build Docker (~2-3 minutes)
8. Attendre le démarrage du service (~30s)
9. Vérifier : `curl https://kraak-api-staging.onrender.com/health`

**Durée** : ~5 minutes  
**Risque** : bas (même source Git, rebuilding Docker)

#### Méthode B : Redeploy depuis Git (tracé)

1. Identifier le dernier commit stable : `git log --oneline -10`
2. Créer une branche rollback : `git checkout -b fix/api-rollback-<yyyymmdd-hhmm>`
3. Revert ou reset vers le commit stable : `git revert -n <commit_sha>` OU `git reset --hard <commit_sha>`
4. Commiter : `git commit -m "fix: rollback API to <commit_sha> due to <incident>"`
5. Pousser : `git push origin fix/api-rollback-<yyyymmdd-hhmm>`
6. Créer une PR, reviewer, merger vers `main`
7. Render détecte le push et redéploie automatiquement
8. Attendre le build Docker (~2-3 minutes) + démarrage (~30s)
9. Vérifier : `curl https://kraak-api-staging.onrender.com/health`

**Durée** : ~10 minutes (incluant build + démarrage)  
**Risque** : très bas (tracé Git clair, process supervisé)

#### Méthode C : Redémarrer sans revert (si c'est un problème temporaire)

```bash
# Si l'API est juste en état instable (timeout, connections saturées, etc.)
# Sans changement de code :

# 1. Via Render UI
# https://dashboard.render.com > kraak-api > Settings > Restart

# 2. Attendre ~30s

# 3. Vérifier
curl https://kraak-api-staging.onrender.com/health

# Utile pour :
# - Nettoyer les connexions Supabase
# - Récupérer d'un deadlock temporaire
# - Réinitialiser le cache mémoire
```

### 2.3 Coordonner un rollback multi-service

Si web ET API doivent être rollbackés ensemble :

```
1. Commencer par l'API (moins visible, prioritaire)
   - Rollback API suivant méthode 2.2.B
   - Attendre vérification: curl https://kraak-api-staging.onrender.com/health

2. Puis rollback web (plus visible)
   - Rollback web suivant méthode 2.1.B
   - Attendre vérification: curl https://kraak-consulting.vercel.app

3. Post-rollback
   - Documenter l'incident
   - Corriger le root cause sur une branche fixe
   - Redéployer vers main quand la correction est vérifiée
```

### 2.4 Prévention de corruption lors de rollback

#### Données d'application

- **Ne jamais** rollback l'API ou le web sans vérifier les migrations Supabase
- Si une migration de schema a été exécutée et ne peut pas être annulée, le rollback du code n'est **pas sûr**
- Dans ce cas, corriger le code pour la nouvelle schema plutôt que de revert

#### Cache client

- Après rollback web, les utilisateurs avec cache peut voient du contenu stale
- Recommander un hard refresh (Cmd+Shift+R ou Ctrl+Shift+F5)
- Ajouter un note dans l'issue d'alerte GitHub expliquant le rollback

---

## 3. Pilot Launch Checklist

### 3.1 Pre-launch Validation (24-48h avant pilot)

#### Infrastructure & Déploiement

- [ ] Web déployée et accessible : `curl -I https://kraak-consulting.vercel.app` → HTTP 200
- [ ] API déployée et accessible : `curl https://kraak-api-staging.onrender.com/health` → `{ "status": "ok", ... }`
- [ ] Supabase production-pilot configuré et connecté
- [ ] Variables d'environnement validées sur tous les services
  - Vercel: https://vercel.com/dashboard/kraak-group > Settings > Environment Variables
  - Render: https://dashboard.render.com > kraak-api > Environment
  - Supabase: https://supabase.com/dashboard > Settings
- [ ] Domaines personnalisés (si applicable) configurés et validés
- [ ] HTTPS/certificats valides sur tous les endpoints publics

#### Observabilité & Alertes

- [ ] Workflow `Observability` activé et testé
  - `pnpm check:observability` exécuté avec succès localement
  - Vérifier les 15 dernières exécutions: https://github.com/Ange230700/kraak-group/actions/workflows/observability.yml
- [ ] Dashboard de santé accessible aux responsables
  - Bookmark: https://github.com/Ange230700/kraak-group/issues?q=label%3A%5BALERT%5D
- [ ] Procédure d'alerte documentée et connue de l'équipe

#### Tests Pré-Pilot

- [ ] Tests unitaires passent (tous les modules)
  - `pnpm test:unit` → sortie: "X tests passed"
- [ ] Tests E2E passent sur le pilot
  - `pnpm test:e2e` → sorties: toutes les suites en vert
- [ ] Accessibility checks passent
  - `pnpm check:prepilot:web` → aucun `critical` ou `serious` écart
- [ ] Performance checks acceptables
  - DCL < 1500ms, FCP < 800ms sur routes critiques (voir QAT-06)
- [ ] Regression suite exécutée (QAT-05)
  - Voir: `docs/runbooks/QAT-05_REGRESSION_2026-04-30.md`

#### Parcours Utilisateur Critiques

Tester manuellement chaque flux principal via https://kraak-consulting.vercel.app :

- [ ] **Page d'accueil** `/`
  - [ ] Charge en < 2s
  - [ ] Tous les héros, sections, images visibles
  - [ ] Liens de navigation fonctionnels
  - [ ] SEO metadata correctes (Title, Description, OG tags)

- [ ] **Page Services** `/services`
  - [ ] Contenu et layout corrects
  - [ ] Catégories cliquables/filtrable

- [ ] **Page Programmes** `/programmes`
  - [ ] Liste des programmes visible
  - [ ] Accès à chaque programme

- [ ] **Page Contact** `/contact`
  - [ ] Formulaire charge et valide les champs
  - [ ] Soumission du formulaire fonctionne
  - [ ] Message de confirmation visible
  - [ ] Email reçu en backend (vérifier logs Render ou Resend)

- [ ] **À propos** `/about` (si présente)
  - [ ] Contenu chargé
  - [ ] Images et vidéos affichées

#### Sécurité & Conformité

- [ ] CORS correctement configuré
  - API accepte les origins web légitimes seulement
  - Vérifier: `CORS_ALLOWED_ORIGINS` dans Render environment

- [ ] Secrets & clés d'API sécurisés
  - Aucune clé en dur dans le code
  - Toutes les clés injectées via variables d'environnement
  - Vérifier avec: `git grep -i "secret\|password\|api.key\|token" -- apps/ | grep -v ".spec\|test\|example"`

- [ ] HTTPS obligatoire
  - Vérifier que tous les endpoints sont HTTPS
  - Test: `curl -I https://kraak-consulting.vercel.app` → `strict-transport-security` header

- [ ] Content-Security-Policy configurée (si applicable)
  - Vérifier headers: `curl -i https://kraak-consulting.vercel.app | grep -i "content-security"`

#### Données & Base de Données

- [ ] Supabase production-pilot data seeded
  - [ ] Programmes avec contenu complet
  - [ ] Catégories de services présentes
  - [ ] Au moins 1 utilisateur test disponible (si applicale pour auth)

- [ ] Migrations Supabase appliquées
  - Vérifier le schéma correspond aux modèles attendus
  - `docs/specs/data_models.md` synchronisé avec le schéma réel

- [ ] Sauvegardes Supabase configurées
  - Vérifier dans dashboard: https://supabase.com/dashboard > Settings > Backups

#### Documentation & Support

- [ ] Runbooks incident/rollback accessibles et clairs
  - Ce document validé
  - Imprimé ou en favoris pour accès rapide en cas d'incident

- [ ] Points de contact et escalade documentés
  - Qui appeler en cas de bug critique
  - Qui peut approuver un rollback

- [ ] Guide utilisateur pilot prêt
  - Email d'invitation pilot rédigé
  - Instructions d'accès claires
  - Feedback form/channel identifié

### 3.2 Jour du Launch (Go/No-Go)

#### Morning Check (2h avant pilot)

```bash
# 1. Web sanity check
curl -I https://kraak-consulting.vercel.app

# 2. API sanity check
curl https://kraak-api-staging.onrender.com/health | jq .

# 3. Observability check
KRAAK_OBSERVABILITY_WEB_URL=https://kraak-consulting.vercel.app \
KRAAK_OBSERVABILITY_API_URL=https://kraak-api-staging.onrender.com \
pnpm check:observability

# 4. Latest deployments ok?
# Vérifier: aucun déploiement en échec dans les 24h dernières heures
```

#### Go/No-Go Decision

- [ ] Tous les checks verts (santé, observabilité, tests)
- [ ] Pas d'incident GitHub ouvert dans les 24h (ou mitigé)
- [ ] Équipe support prête
- [ ] Participants pilot informés
- [ ] Rollback procedures testées et documentées

**Décision finale** : `GO` ou `NO-GO` (rester sur staging si `NO-GO`)

### 3.3 Launch Window

1. **Notification pré-lancement** (30 min avant)
   - Informer les participants que le pilot s'ouvre bientôt
   - Vérifier qu'ils ont les instructions d'accès

2. **Monitoring intensif** (1h après lancement)
   - Consulter GitHub issues toutes les 10 minutes
   - Vérifier les logs Render et Vercel
   - Être prêt à rollback

3. **Stabilité** (4-24h post-lancement)
   - Workflow `Observability` s'exécute automatiquement
   - Problèmes remontés via le formulaire de contact
   - Triage et priorisation des bugs

### 3.4 Post-Launch Monitoring

- [ ] Workflow `Observability` tournant et alertes correctes
- [ ] Formulaire de contact reçoit les soumissions
- [ ] Logs accessibles pour diagnostic
- [ ] Incident response team en attente

---

## 4. Communication & Escalade

### 4.1 Canaux d'alerte

| Incident Level         | Détection                | Action                                    |
| ---------------------- | ------------------------ | ----------------------------------------- |
| Critic (Pilot down)    | Observability en < 15min | GitHub issue, notifier équipe asap        |
| High (Feature broken)  | Participant rapporte     | Triage, créer issue, commencer diagnostic |
| Medium (Perf degraded) | Monitoring ou feedback   | Logger, planifier un fix post-pilot       |
| Low (UI tweak)         | Participant feedback     | Backlog pour itération suivante           |

### 4.2 Escalade

```
Incident NON-RÉSOLU après:
  - 15 min (Web critique) → appeler responsable infrastructure
  - 30 min (API critique) → appeler responsable backend
  - 60 min (Feature broken) → appeler responsable produit
```

---

## 5. Annexe : Checklist Rapide de Poche

```
🚨 INCIDENT DÉTECTÉ ?

1. Vérifier l'issue GitHub [ALERT][DEP-05]
2. Diagnostiquer: curl web + curl API /health
3. Chercher les logs: Vercel dashboard + Render dashboard
4. Identifier le domaine: Web? API? Supabase?
5. Mitiger: Redémarrer / Redeploy / ROLLBACK
6. Post-incident: Documenter + Corriger + Déployer

📋 AVANT PILOT LAUNCH (24h avant):

✓ Web déployé et 200
✓ API déployé et /health OK
✓ Tests E2E passent
✓ Observability testée
✓ Runbooks relus
✓ Support team ready
✓ Rollback testé

🟢 GO/NO-GO (2h avant):

✓ Sanity checks ok
✓ Pas d'alerte ouverte
✓ Team sur position
✓ Communication go

📞 ESCALADE (si > temps limite):

Appeler = 🚨
```

---

## 6. Historique et Mises à Jour

| Date       | Version | Auteur | Changements              |
| ---------- | ------- | ------ | ------------------------ |
| 2026-04-30 | 1.0     | Ops    | Création initiale DEP-06 |

---

## Ressources Externes

- Vercel docs: https://vercel.com/docs/deployments/overview
- Render docs: https://render.com/docs
- Supabase dashboard: https://supabase.com/dashboard
- GitHub issues: https://github.com/Ange230700/kraak-group/issues
- Observability workflow: https://github.com/Ange230700/kraak-group/actions/workflows/observability.yml
