#!/usr/bin/env bash
set -euo pipefail

# Script compagnon: crée labels + milestones manquants puis crée les child issues.
# Usage:
#   bash scripts/github/create_child_issues_end_to_end.sh
# Prérequis:
#   gh auth login

REPO="Ange230700/kraak-consulting"

log() {
  printf '%s\n' "$*"
}

ensure_label() {
  local name="$1"
  local color="$2"
  local description="$3"

  if gh label list --repo "$REPO" --limit 1000 --json name --jq '.[].name' | grep -Fxq "$name"; then
    log "[label] OK: $name"
  else
    gh label create "$name" --repo "$REPO" --color "$color" --description "$description"
    log "[label] CREATED: $name"
  fi
}

ensure_milestone() {
  local title="$1"
  local description="$2"

  if gh api "repos/$REPO/milestones?state=all&per_page=100" --jq '.[].title' | grep -Fxq "$title"; then
    log "[milestone] OK: $title"
  else
    gh api --method POST "repos/$REPO/milestones" -f title="$title" -f description="$description" >/dev/null
    log "[milestone] CREATED: $title"
  fi
}

issue_exists() {
  local id="$1"
  local query="\"[TASK][$id]\" in:title"
  local count
  count="$(gh issue list --repo "$REPO" --state all --search "$query" --limit 1 --json number --jq 'length')"
  [[ "$count" -gt 0 ]]
}

create_task_issue() {
  local id="$1"
  local title="$2"
  local area="$3"
  local epic="$4"
  local priority="$5"
  local milestone="$6"
  local deps="$7"

  if issue_exists "$id"; then
    log "[issue] SKIP (already exists): $id"
    return
  fi

  gh issue create \
    --repo "$REPO" \
    --title "[TASK][$id] $title" \
    --label "type: task" \
    --label "area: $area" \
    --label "epic: $epic" \
    --label "priority: $priority" \
    --label "status: backlog" \
    --milestone "$milestone" \
    --body "$(cat <<EOF
## Parent epic
$epic

## Description
$title

## Dependencies
$deps

## Acceptance criteria
- [ ] Scope of $id implemented
- [ ] Dependencies satisfied ($deps)
- [ ] Validation evidence added (tests/checks/screenshots as relevant)
EOF
)" >/dev/null

  log "[issue] CREATED: $id"
}

log "== Ensuring labels =="
ensure_label "type: task" "0E8A16" "Tâche implementation"
ensure_label "status: backlog" "6E7781" "Non démarré"
ensure_label "priority: P0" "B60205" "Bloquant MVP"
ensure_label "priority: P1" "D93F0B" "Essentiel non bloquant immédiat"

ensure_label "area: architecture" "1D76DB" "Architecture"
ensure_label "area: workspace" "5319E7" "Workspace"
ensure_label "area: shared-libs" "0366D6" "Shared libraries"
ensure_label "area: website" "0E8A16" "Website"
ensure_label "area: mobile-shell" "006B75" "Mobile shell"
ensure_label "area: auth" "BFDADC" "Authentication"
ensure_label "area: dashboard" "FBCA04" "Dashboard"
ensure_label "area: programs" "C2E0C6" "Programs"
ensure_label "area: resources" "7057FF" "Resources"
ensure_label "area: announcements" "F9D0C4" "Announcements"
ensure_label "area: support" "D4C5F9" "Support"
ensure_label "area: qa" "0052CC" "Quality assurance"
ensure_label "area: deployment" "BFD4F2" "Deployment"

ensure_label "epic: ARC" "1D76DB" "Epic Architecture"
ensure_label "epic: SET" "5319E7" "Epic Workspace setup"
ensure_label "epic: LIB" "0366D6" "Epic Shared libraries"
ensure_label "epic: WEB" "0E8A16" "Epic Website"
ensure_label "epic: MOB" "006B75" "Epic Mobile shell"
ensure_label "epic: AUT" "BFDADC" "Epic Auth"
ensure_label "epic: DSH" "FBCA04" "Epic Dashboard"
ensure_label "epic: PRG" "C2E0C6" "Epic Programs"
ensure_label "epic: RES" "7057FF" "Epic Resources"
ensure_label "epic: ANN" "F9D0C4" "Epic Announcements"
ensure_label "epic: SUP" "D4C5F9" "Epic Support"
ensure_label "epic: QAT" "0052CC" "Epic QA"
ensure_label "epic: DEP" "BFD4F2" "Epic Deployment"

log "== Ensuring milestones =="
ensure_milestone "M1 - Architecture locked" "Architecture validée et tracée"
ensure_milestone "M2 - Workspace bootstrapped" "Socle de dev opérationnel"
ensure_milestone "M3 - Mobile shell ready" "Shell mobile navigable et installable"
ensure_milestone "M4 - Auth ready" "Authentification stable web/mobile/api"
ensure_milestone "M5 - Core participant flows ready" "Parcours coeur participant utilisables"
ensure_milestone "M6 - QA ready" "Couverture de test et stabilisation pre-lancement"
ensure_milestone "M7 - Pilot release ready" "Déploiement pilote et runbooks opérationnels"

log "== Creating child issues =="
while IFS='|' read -r id title area epic priority milestone deps; do
  create_task_issue "$id" "$title" "$area" "$epic" "$priority" "$milestone" "$deps"
done <<'EOF'
ARC-01|Valider architecture cible web/mobile/api avec scope MVP|architecture|ARC|P0|M1 - Architecture locked|none
ARC-02|Définir conventions repo (naming, structure, quality gates)|architecture|ARC|P0|M1 - Architecture locked|ARC-01
ARC-03|Définir stratégie de rendu web (SEO/prerender)|architecture|ARC|P0|M1 - Architecture locked|ARC-01
ARC-04|Définir modèles de donnees MVP|architecture|ARC|P0|M1 - Architecture locked|ARC-01
ARC-05|Documenter ADRs et critères anti-scope-creep|architecture|ARC|P1|M1 - Architecture locked|ARC-02, ARC-04
SET-01|Initialiser workspace Angular monorepo (apps/web, apps/mobile)|workspace|SET|P0|M2 - Workspace bootstrapped|ARC-02
SET-02|Initialiser apps/api NestJS et wiring de base|workspace|SET|P0|M2 - Workspace bootstrapped|ARC-02
SET-03|Configurer quality gates (lint, format, typecheck)|workspace|SET|P0|M2 - Workspace bootstrapped|SET-01, SET-02
SET-04|Configurer test runners unitaires + integration|workspace|SET|P0|M2 - Workspace bootstrapped|SET-01, SET-02
SET-05|Configurer Playwright E2E et smoke pipeline|workspace|SET|P0|M2 - Workspace bootstrapped|SET-01, SET-04
SET-06|Configurer CI GitHub Actions multi-apps|workspace|SET|P0|M2 - Workspace bootstrapped|SET-03, SET-04, SET-05
SET-07|Mettre en place variables d'environnement et runbook local dev|workspace|SET|P1|M2 - Workspace bootstrapped|SET-02
LIB-01|Créer packages/contracts (DTO, schema validation, versioning)|shared-libs|LIB|P0|M2 - Workspace bootstrapped|ARC-04, SET-02
LIB-02|Créer packages/domain (règles metier pures MVP)|shared-libs|LIB|P0|M2 - Workspace bootstrapped|ARC-04, LIB-01
LIB-03|Créer packages/api-client (typed client web/mobile vers API)|shared-libs|LIB|P1|M2 - Workspace bootstrapped|LIB-01, SET-02
LIB-04|Ajouter tests unitaires libs + guideline de publication interne|shared-libs|LIB|P1|M2 - Workspace bootstrapped|LIB-02, LIB-03
WEB-01|Implementer pages core (Accueil, A propos, Services, Programmes, Contact)|website|WEB|P0|M5 - Core participant flows ready|SET-01, ARC-03
WEB-02|Intégrer formulaires de contact et CTA conversion|website|WEB|P0|M5 - Core participant flows ready|WEB-01, SUP-01
WEB-03|Ajouter SEO technique (meta, sitemap, robots, Open Graph)|website|WEB|P0|M5 - Core participant flows ready|WEB-01
WEB-04|Ajouter analytics web (PostHog/GA)|website|WEB|P1|M5 - Core participant flows ready|WEB-01
WEB-05|Optimiser accessibilité/performance (objectif Lighthouse > 90)|website|WEB|P1|M5 - Core participant flows ready|WEB-01, WEB-03
MOB-01|Initialiser app Ionic Angular dans apps/mobile|mobile-shell|MOB|P0|M3 - Mobile shell ready|SET-01
MOB-02|Mettre en place navigation shell (tabs/stack) et layout de base|mobile-shell|MOB|P0|M3 - Mobile shell ready|MOB-01
MOB-03|Intégrer theming, design tokens et composants UI de base|mobile-shell|MOB|P1|M3 - Mobile shell ready|MOB-01, LIB-01
MOB-04|Configurer Capacitor (Android/iOS) et builds debug|mobile-shell|MOB|P0|M3 - Mobile shell ready|MOB-01
MOB-05|Ajouter service notifications push stub (FCM wiring initial)|mobile-shell|MOB|P1|M3 - Mobile shell ready|MOB-04, SET-02
AUT-01|Configurer Supabase Auth (providers, policies de base)|auth|AUT|P0|M4 - Auth ready|ARC-04, SET-02
AUT-02|Implementer endpoints API auth/session (NestJS)|auth|AUT|P0|M4 - Auth ready|AUT-01, LIB-01
AUT-03|Implementer écrans login/signup/reset mobile|auth|AUT|P0|M4 - Auth ready|MOB-02, AUT-02
AUT-04|Implementer garde routes protegees web/mobile|auth|AUT|P0|M4 - Auth ready|AUT-02, LIB-03
AUT-05|Ajouter gestion role participant/admin minimal|auth|AUT|P1|M4 - Auth ready|AUT-02, ARC-04
DSH-01|Définir contenu dashboard MVP (cartes, rappels, dernières actus)|dashboard|DSH|P0|M5 - Core participant flows ready|ARC-04
DSH-02|Exposer endpoint dashboard aggregate cote API|dashboard|DSH|P0|M5 - Core participant flows ready|SET-02, LIB-01, AUT-02
DSH-03|Implementer vue dashboard mobile|dashboard|DSH|P0|M5 - Core participant flows ready|MOB-02, AUT-04, DSH-02
DSH-04|Implementer vue dashboard web participant (si activée MVP)|dashboard|DSH|P1|M5 - Core participant flows ready|WEB-01, AUT-04, DSH-02
PRG-01|Définir modèle programme/cohorte/statut progression MVP|programs|PRG|P0|M5 - Core participant flows ready|ARC-04
PRG-02|Implementer endpoints liste/detail programmes|programs|PRG|P0|M5 - Core participant flows ready|SET-02, LIB-01, AUT-02, PRG-01
PRG-03|Implementer écran mobile liste + detail programme|programs|PRG|P0|M5 - Core participant flows ready|MOB-02, PRG-02
PRG-04|Implementer marquage de progression minimale|programs|PRG|P1|M5 - Core participant flows ready|PRG-02, LIB-02
PRG-05|Ajouter scenarii de test Given/When/Then programmes|programs|PRG|P1|M5 - Core participant flows ready|PRG-03, PRG-04, QAT-01
RES-01|Définir taxonomie ressources (type, theme, audience)|resources|RES|P0|M5 - Core participant flows ready|ARC-04
RES-02|Implementer endpoints ressources (liste, filtre, detail)|resources|RES|P0|M5 - Core participant flows ready|SET-02, LIB-01, AUT-02, RES-01
RES-03|Implementer écran mobile ressources (recherche/filtre)|resources|RES|P0|M5 - Core participant flows ready|MOB-02, RES-02
RES-04|Implementer tracking consultation ressources|resources|RES|P1|M5 - Core participant flows ready|RES-02, WEB-04
ANN-01|Définir format annonce et règles de publication MVP|announcements|ANN|P0|M5 - Core participant flows ready|ARC-04
ANN-02|Implementer endpoints annonces (feed + detail)|announcements|ANN|P0|M5 - Core participant flows ready|SET-02, LIB-01, AUT-02, ANN-01
ANN-03|Implementer flux annonces dans mobile dashboard/feed|announcements|ANN|P0|M5 - Core participant flows ready|MOB-02, DSH-02, ANN-02
ANN-04|Ajouter notification push pour annonce prioritaire|announcements|ANN|P1|M5 - Core participant flows ready|MOB-05, ANN-02
SUP-01|Implementer endpoint contact/support (API + validation)|support|SUP|P0|M5 - Core participant flows ready|SET-02, LIB-01
SUP-02|Intégrer formulaire support dans mobile|support|SUP|P0|M5 - Core participant flows ready|MOB-02, SUP-01, AUT-04
SUP-03|Intégrer formulaire contact site web|support|SUP|P0|M5 - Core participant flows ready|WEB-01, SUP-01
SUP-04|Configurer envoi email transactionnel (Resend ou equivalent)|support|SUP|P1|M5 - Core participant flows ready|SUP-01
SUP-05|Ajouter suivi et statut basique des demandes support|support|SUP|P1|M5 - Core participant flows ready|SUP-01, AUT-05
QAT-01|Définir matrice de couverture (page, composant, comportement)|qa|QAT|P0|M6 - QA ready|SET-04, SET-05
QAT-02|Écrire tests unitaires composants critiques web/mobile|qa|QAT|P0|M6 - QA ready|QAT-01, WEB-01, MOB-02
QAT-03|Écrire tests integration API modules critiques|qa|QAT|P0|M6 - QA ready|QAT-01, AUT-02, PRG-02, RES-02, ANN-02, SUP-01
QAT-04|Écrire E2E Given/When/Then pour parcours coeur participant|qa|QAT|P0|M6 - QA ready|QAT-01, AUT-03, DSH-03, PRG-03, RES-03, SUP-02
QAT-05|Realiser campagne regression et corriger blockers|qa|QAT|P0|M6 - QA ready|QAT-02, QAT-03, QAT-04
QAT-06|Realiser checks accessibilité/performance pre-pilot|qa|QAT|P1|M6 - QA ready|QAT-05, WEB-05
DEP-01|Configurer environnements (dev/staging/pilot)|deployment|DEP|P0|M7 - Pilot release ready|SET-07
DEP-02|Mettre en place pipeline déploiement web|deployment|DEP|P0|M7 - Pilot release ready|SET-06, WEB-05
DEP-03|Mettre en place pipeline déploiement API|deployment|DEP|P0|M7 - Pilot release ready|SET-06, QAT-03
DEP-04|Preparer distribution mobile test (APK/TestFlight interne)|deployment|DEP|P0|M7 - Pilot release ready|MOB-04, QAT-04
DEP-05|Finaliser observabilité et alerting minimum|deployment|DEP|P1|M7 - Pilot release ready|DEP-02, DEP-03
DEP-06|Rédiger runbook incident + rollback + pilot checklist|deployment|DEP|P0|M7 - Pilot release ready|DEP-01, DEP-05, QAT-06
DEP-07|Executer go/no-go pilote et publier release pilote|deployment|DEP|P0|M7 - Pilot release ready|DEP-02, DEP-03, DEP-04, DEP-06
EOF

log "== Done =="
log "Labels + milestones verified. Child issue creation executed (existing issues skipped)."
