# STAGING_PROD_SEPARATION_30MIN — Check-list executable en 30 minutes

Objectif: séparer proprement les responsabilités opérationnelles.

- Ange230700: conserve tous les droits sur tous les environnements.
- Ownership des ressources staging: compte GitHub Ange230700.
- Ownership des ressources prod: compte GitHub kraakconsulting.
- Responsabilite d'exploitation: staging pilote par Ange230700, prod pilotee par kraakconsulting.

Cette procedure est volontairement peu disruptive: elle ne change ni l'architecture de deploiement, ni les workflows principaux. Elle verrouille surtout les droits et les validations.

---

## Prerequis

- Etre connecte a GitHub avec un compte administrateur du depot.
- Etre connecte a Render avec un compte ayant les droits de gestion des services.
- Etre connecte a Vercel avec les droits de gestion du projet.
- Avoir les deux collaborateurs deja invites et actifs sur le repo.

---

## Plan rapide (30 min)

- Bloc A GitHub (12 min)
- Bloc B Render (8 min)
- Bloc C Vercel (6 min)
- Bloc D Validation finale (4 min)

---

## Bloc A — GitHub (12 min)

### A1. Verrouiller l'approbation prod via Environment (5 min)

1. Ouvrir le depot GitHub `Ange230700/kraak-consulting`.
2. Cliquer `Settings` (barre d'onglets du repo).
3. Dans le menu lateral, cliquer `Environments`.
4. Cliquer sur l'environnement `production`.
5. Section `Deployment protection rules`:
   - cliquer `Required reviewers` puis `Edit`.
   - ajouter `kraakconsulting`.
   - conserver `Ange230700` dans la liste des approbateurs (droits admin conserves).
   - cliquer `Save protection rules`.

Résultat attendu:

- Toute release prod passe par une gate `production` avec `kraakconsulting` comme approbateur present.
- `Ange230700` conserve ses droits d'administration sur l'environnement `production`.

### A2. Restreindre la creation des tags de release (4 min)

1. Toujours dans `Settings`, cliquer `Rules` puis `Rulesets`.
2. Cliquer `New ruleset` puis `New tag ruleset`.
3. Nommer le ruleset: `Protect SemVer tags`.
4. Dans `Target tags`, saisir le pattern: `v*`.
5. Activer la restriction des acteurs autorises a creer/mettre a jour ces tags.
6. Autoriser `kraakconsulting` et `Ange230700` (plus un compte break-glass si politique interne).
7. Cliquer `Create`.

Resultat attendu:

- Les tags SemVer de prod sont controles sans retirer les droits admin de `Ange230700`.

### A3. Activer les validations CODEOWNERS en PR (3 min)

1. Dans `Settings`, cliquer `Branches`.
2. Ouvrir la regle de protection de `staging`.
3. Cocher `Require review from Code Owners`.
4. Verifier que les checks obligatoires restent inchanges.
5. Cliquer `Save changes`.
6. Refaire la meme verification sur la regle de `main` si elle existe.

Resultat attendu:

- Les fichiers sensibles demandent automatiquement la bonne revue selon CODEOWNERS.

---

## Bloc B — Render (8 min)

### B1. Garder Ange sur staging uniquement (4 min)

1. Ouvrir le dashboard Render.
2. Aller dans le workspace KRAAK.
3. Ouvrir `kraak-web-staging`.
4. Cliquer `Settings` puis `Members` (ou `Team`, selon UI).
5. Verifier que `Ange230700` a les droits de gestion sur staging.
6. Refaire pour `kraak-api-staging`.

### B2. Figer l'ownership compte staging/prod (4 min)

1. Ouvrir `kraak-web-prod` puis `Settings` > `Members`.
2. Verifier que le service prod est rattache au compte/organisation GitHub `kraakconsulting`.
3. Conserver les droits admin de `Ange230700` (ne pas les retirer).
4. Refaire la meme operation pour `kraak-api-prod`.
5. Verifier que les services staging restent rattaches au compte/organisation GitHub `Ange230700`.

Resultat attendu:

- Ownership staging: `Ange230700`.
- Ownership prod: `kraakconsulting`.
- `Ange230700` conserve ses droits administrateur sur tous les environnements.

---

## Bloc C — Vercel (6 min)

### C1. Verrouiller Production sur kraakconsulting (4 min)

1. Ouvrir le projet Vercel correspondant au web KRAAK.
2. Cliquer `Settings` puis `Members` (ou `Team Members`).
3. Verifier que le projet de production est rattache a l'equipe/compte `kraakconsulting`.
4. Conserver les droits admin de `Ange230700` si deja attribues.
5. Verifier que le projet staging reste rattache a l'equipe/compte `Ange230700`.

### C2. Verifier la branche de prod (2 min)

1. Dans `Settings` > `Git`, verifier la `Production Branch`.
2. Confirmer qu'elle n'introduit pas de deploiement auto non souhaite.
3. Ne rien changer si votre flux actuel par tag/workflow est deja stable.

Resultat attendu:

- Ownership prod web: `kraakconsulting`.
- Ownership staging web: `Ange230700`.
- Droits admin de `Ange230700` conserves.

---

## Bloc D — Validation finale (4 min)

### D1. Test d'autorisation release prod

1. Ouvrir `Actions` dans GitHub.
2. Lancer `Release Prod` via `Run workflow` (reference de test).
3. Verifier que le job s'arrete sur la gate `production` en attente d'approbation.
4. Verifier que `kraakconsulting` est bien approbateur de la gate.
5. Verifier que `Ange230700` conserve les droits admin sur l'environnement.
6. Annuler le run de test.

### D2. Test staging non regressif

1. Pousser un petit commit non critique sur `staging`.
2. Verifier auto-deploiement de `kraak-api-staging` et `kraak-web-staging`.
3. Verifier `https://kraak-api-staging.onrender.com/health`.

---

## Evidence a conserver

- Capture de la page GitHub Environment `production` (Required reviewers).
- Capture du ruleset tags `v*`.
- Capture Render des droits prod/staging.
- Capture Vercel des droits production.
- Lien du run `Release Prod` en attente d'approbation.

Modele pret a coller dans une issue:

- `docs/runbooks/STAGING_PROD_SEPARATION_ISSUE_COMMENT_TEMPLATE.md`

---

## Addendum — RACI d'exploitation (regle figee)

Perimetre: exploitation des environnements `staging` et `production`.

| Activite                                          | Ange230700 | kraakconsulting |
| ------------------------------------------------- | ---------- | --------------- |
| Administration des acces (staging + prod)         | A/R        | C               |
| Ownership compte Render/Supabase staging          | A/R        | I               |
| Ownership compte Render/Supabase production       | C/I        | A/R             |
| Deploiement staging (`staging` -> Render staging) | A/R        | C/I             |
| Validation fonctionnelle staging                  | A/R        | C/I             |
| Approbation gate GitHub `production`              | C/I        | A/R             |
| Creation et promotion tag SemVer prod (`v*`)      | C/I        | A/R             |
| Deploiement production (Render/Vercel)            | C/I        | A/R             |
| Rollback staging                                  | A/R        | C/I             |
| Rollback production                               | C/I        | A/R             |

Legend:

- R = Responsible (execute)
- A = Accountable (decisionnaire)
- C = Consulted (consulte)
- I = Informed (informe)

Regle d'arbitrage:

- Aucun changement de responsabilite n'est effectif sans mise a jour de ce runbook et preuve d'execution dans l'issue de suivi.
- En cas d'incident cross-environnements, `kraakconsulting` tranche pour la production et `Ange230700` tranche pour le staging.
- Les droits administrateur de `Ange230700` restent conserves sur tous les environnements.
- La separation est basee sur l'ownership des comptes de ressources (staging compte `Ange230700`, production compte `kraakconsulting`) et non sur un retrait de droits admin de `Ange230700`.

---

## Rollback rapide (si besoin)

Si un verrouillage bloque trop:

1. Revenir dans GitHub `Settings` > `Environments` > `production` et restaurer les reviewers precedents.
2. Desactiver temporairement le ruleset tags `v*`.
3. Restaurer les droits precedents dans Render/Vercel.

Temps de retour arriere estime: 5 a 10 minutes.
