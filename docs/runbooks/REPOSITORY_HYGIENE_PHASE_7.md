# Phase 7 - Hygiène du dépôt

Date d'audit : 2026-07-22

## Synthèse

- Branche d'intégration confirmée : `staging`.
- Branches locales obsolètes supprimées : `docs/align-workflow-and-deployment`, `docs/audit-current-doc-state`.
- Artefacts locaux retirés du suivi Git : exports GitHub Project, sorties de test, exports Sonar temporaires et scripts locaux associés.
- Stashes audités sans `git stash clear`.
- Mises à jour de dépendances reportées : elles doivent rester dans des PR séparées après baseline verte.

## Stashes audités

Les références `stash@{n}` peuvent changer après suppression. Utiliser les hashes
ci-dessous comme identifiants stables.

| Ref d'audit | Hash                                       | Date UTC   | Contenu observé                                                                            | Décision                                                                                           |
| ----------- | ------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `stash@{0}` | `832fcce7cb17c140809fe7df0670baa5888c1684` | 2026-07-02 | Sauvegarde `lint-staged` avec un changement de guillemets dans `.github/workflows/ci.yml`. | À supprimer : bruit de formatage uniquement.                                                       |
| `stash@{1}` | `db5e60c882a235307795256060d4ced1c42c703a` | 2026-05-31 | Lot de specs de couverture, plus artefacts Sonar non suivis.                               | Garder/documenter. Convertir en branche courte seulement si un lot couverture est relancé.         |
| `stash@{2}` | `ad76c1ea25b60e51ce1168f23f71e74167a2b296` | 2026-05-22 | Résolution de conflits PR avec templates `programs`/`services` et migration Supabase.      | Candidat à suppression après confirmation fonctionnelle ; application conflictuelle sur `staging`. |
| `stash@{3}` | `36bc33cd41f7628507d63501ada0146d659049a2` | 2026-05-22 | Report local de changements PR, CI, sitemap et template services.                          | Candidat à suppression ; application conflictuelle et probablement dépassée.                       |
| `stash@{4}` | `b81da0ebb734062a93b2d7c9053382aa9d6e6cfc` | 2026-05-21 | Résolution temporaire limitée au template services.                                        | Candidat à suppression ; doublonne les stashes de conflits PR.                                     |
| `stash@{5}` | `afa5bde0714484cd71c322ef5ceb4d7cfb4565ad` | 2026-05-19 | Changement local sur migration Supabase distante.                                          | Garder/documenter jusqu'à confirmation que la migration cible est entièrement remplacée.           |
| `stash@{6}` | `6d545ae64574ce19d8ca2fefb467962253291a42` | 2026-05-17 | Package client, lockfile et migration Supabase de release prod.                            | Garder/documenter. À convertir en branche seulement si le sujet migration/dépendances est repris.  |
| `stash@{7}` | `f5fadcee6da1e69c3caf006e5150713615e50562` | 2026-05-12 | Large lot `pnpm onlyBuiltDependencies`, CI, docs, specs et runbooks.                       | Garder/documenter ; ne pas appliquer directement, extraire par petits lots si besoin.              |
| `stash@{8}` | `dc3a73ac7b3e94732a62e0f45ffa067a9133facc` | 2026-05-07 | Large lot performance mobile et ajustements web/mobile.                                    | Garder/documenter ; convertir en branche dédiée si le chantier perf mobile est réactivé.           |
| `stash@{9}` | `d520b23fb442527bdf2a8b8b47ddcb15dfc207ec` | 2026-05-07 | Specs de couverture API/web.                                                               | Garder/documenter jusqu'à vérification de la couverture actuelle.                                  |

## Artefacts retirés du suivi

Ces fichiers étaient des sorties locales, temporaires ou générables. Aucun
contenu de clé privée, token, mot de passe ou secret exploitable n'a été observé
dans les fichiers `.keys-batch*.json` ; ils contenaient des clés de composants
Sonar/GitHub Project et des chemins de fichiers.

- `.extract-keys.cjs`
- `.rank-coverage.cjs`
- `.keys-batch1.json`
- `.keys-batch2.json`
- `.keys-batch3.json`
- `fields.json`
- `items.json`
- `pr_body.txt`
- `sonar-tree-tmp.json`
- `test-output.txt`

Les mêmes chemins sont ajoutés à `.gitignore` pour éviter une réintroduction.

## Gros fichiers suivis

Constat au 2026-07-22 :

- `apps/client/projects/web/llms-full.md` : environ 2,7 Mo, documentation PrimeNG générée.
- Images de marque web/mobile : plusieurs PNG proches de 1 Mo, avec duplication entre `web/public` et `mobile/public`.
- `test-output.txt` : environ 205 Ko, retiré du suivi dans ce lot.

Suites recommandées dans des PR séparées :

- Décider si `apps/client/projects/web/llms-full.md` doit être généré localement au lieu d'être commité.
- Compresser ou régénérer les PNG de marque.
- Éviter les doublons web/mobile lorsque les contraintes de build le permettent.

## Dépendances

Ne pas combiner les upgrades de dépendances avec cette hygiène de dépôt. Garder
les PR séparées :

- `chore(deps): update non-breaking developer dependencies`
- `chore(deps): upgrade commit tooling`
