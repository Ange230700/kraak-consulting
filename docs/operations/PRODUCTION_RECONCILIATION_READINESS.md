# État de préparation à la réconciliation de production

**État : BLOQUÉ — ne pas retirer staging ni appliquer de migration en production.**
**Périmètre :** inspection des branches `main` et `staging`, du site public et des workflows de déploiement. Aucune mutation distante, migration, publication, suppression ou modification de données n’a été effectuée.

Observations du 22 octobre 2026. La branche locale `ange230700-production-reconciliation` est basée sur `origin/main`, commit `fc46d62600510685b8930e1ddbf2b85f9fc9ad61`. Les changements restent non commités; aucun push, merge ou tag n’a été créé.

## Résumé exécutif

Le site public Vercel et l’API de production répondent, mais la production n’est pas prête à être considérée comme réconciliée ni comme preuve que staging peut être retiré. La page publique servie est sur Vercel, tandis que l’URL Render observée pour le web répond 404 et que `render.yaml` ne définit que les API. Le code local corrige l’allow-list CSP obsolète du site et la configuration du serveur de développement Angular, mais ces corrections ne sont pas déployées : la CSP du site en ligne reste inchangée.

La divergence entre les branches est importante (139 commits propres à `main`, 269 propres à `staging`, et 798 chemins dans la comparaison trois-points observée). Les deux branches comportent des ensembles de migrations différents (7 sur `main`, 22 sur `staging`). Sans accès authentifié à l’historique Supabase, à l’état réel des schémas et à des preuves de sauvegarde/restauration, aucun rattrapage, cherry-pick de migrations ou retrait de staging ne peut être déclaré sûr.

## Vérifications observées

| Sujet                                                | Résultat                                                                                                                           | Statut                                          |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Site public `https://kraak-consulting.vercel.app`    | HTTP 200 lors de la vérification                                                                                                   | PASS — disponibilité HTTP seulement             |
| API `https://kraak-api-prod.onrender.com/health`     | HTTP 200, `status=ok`, `environment=production`, `version=v1.1.6`                                                                  | PASS — health check seulement                   |
| URL web Render `https://kraak-web-prod.onrender.com` | HTTP 404                                                                                                                           | FAIL — ne correspond pas au site public observé |
| Cible API du bundle de production servi              | Le bundle inspecté référence l’API de production, pas l’API staging                                                                | PASS — pour le bundle observé                   |
| CSP du site Vercel en ligne                          | `connect-src` autorise l’API staging et n’autorise pas l’API prod                                                                  | FAIL — configuration en ligne obsolète          |
| Configuration locale de production Angular           | `environment.production.ts` cible déjà l’API prod                                                                                  | PASS                                            |
| Protection de `main`                                 | API GitHub observée : vérifications requises et historique linéaire; approbations requises à 0 malgré la règle de revue CODEOWNERS | PARTIEL                                         |
| Protection de `staging`                              | La requête API GitHub a renvoyé 404; protection non démontrée                                                                      | BLOCKED                                         |
| État appliqué des migrations Supabase                | Aucun accès authentifié aux bases ni à leur historique n’a été vérifié                                                             | NOT VERIFIED                                    |
| Sauvegarde et restauration Supabase                  | Aucune preuve vérifiable de sauvegarde restaurable recueillie                                                                      | NOT VERIFIED                                    |

Ces résultats ne démontrent ni le bon fonctionnement complet des parcours web/API, ni celui de l’authentification, des e-mails, ou des données persistantes.

## Changements locaux non déployés

- `vercel.json` autorise désormais l’API de production dans la CSP et retire l’API staging de cette politique. Le contrôle de build Git Vercel est inversé pour autoriser le build automatique de `staging` et ignorer les autres branches; le déploiement de production reste décrit par le workflow de release par tag.
- Dans `apps/client/angular.json`, `security.allowedHosts` a été déplacé de la configuration du build vers les options du serveur de développement, où se trouve cette option.
- Des tests de régression couvrent ces deux configurations.

Le site public n’a pas été redéployé. La correction CSP ne prendra effet en production qu’après une release autorisée et un contrôle HTTP du résultat. Le changement de CSP corrige une permission de connexion incohérente; les preuves disponibles ne montrent pas que le bundle de production appelait réellement staging.

La politique CSP est statique et commune au projet Vercel utilisant ce fichier. Elle cible ici la production : ne pas réutiliser cette politique pour un build ciblant l’API staging sans configuration distincte. Le contrôle `ignoreCommand` concerne les builds de l’intégration Git; il ne constitue pas une approbation de release ni une preuve de la configuration du projet Vercel hébergé.

## Migrations et voies d’application

- Sur `main`, `.github/workflows/release-prod.yml` applique les migrations avec `supabase db push` après validation d’un tag accessible depuis `main`, des builds/tests et l’entrée dans l’environnement GitHub `production`.
- Sur `staging`, `.github/workflows/supabase-migrations-guard.yml` est déclenché par des pushes touchant les migrations. Il associe `staging` à l’environnement staging et `main` à l’environnement production, puis lance `supabase db push --db-url`. Ce workflow est présent sur `origin/staging`, pas sur le `origin/main` inspecté; s’il est promu, il crée une seconde voie d’application en production en parallèle du workflow par tag.
- L’ensemble de migrations diffère : 7 fichiers sur `main` contre 22 sur `staging`. Le décompte des fichiers et la différence Git ne révèlent pas quelles migrations ont déjà été appliquées à chaque base ni si elles préservent les données.

Ne pas relancer `db push`, ne pas basculer de secrets ni fusionner les deux ensembles avant d’avoir vérifié les migrations appliquées sur chaque projet, les schémas, les sauvegardes et le plan de restauration avec une personne autorisée.

### Comparaison Git complémentaire et accès Supabase

La comparaison des identifiants de blobs Git confirme que les sept migrations communes sont strictement identiques entre `origin/main` et `origin/staging`. Les quinze autres fichiers sont présents uniquement sur `origin/staging`. Il ne s’agit pas d’un inventaire des migrations réellement appliquées.

| Versions de migrations                                                                                                       | Présence dans Git                | État appliqué staging / production |
| ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------- |
| `20250718000000`, `20260414000000`, `20260429110000`, `20260429120000`, `20260503162559`, `20260515113000`, `20260516063000` | Identiques sur les deux branches | NOT VERIFIED / NOT VERIFIED        |
| `20260524103000`                                                                                                             | Staging uniquement               | NOT VERIFIED / NOT VERIFIED        |
| `20260526130000`                                                                                                             | Staging uniquement               | NOT VERIFIED / NOT VERIFIED        |
| `20260526140000`                                                                                                             | Staging uniquement               | NOT VERIFIED / NOT VERIFIED        |
| `20260526140100`                                                                                                             | Staging uniquement               | NOT VERIFIED / NOT VERIFIED        |
| `20260526163500`                                                                                                             | Staging uniquement               | NOT VERIFIED / NOT VERIFIED        |
| `20260602183000`                                                                                                             | Staging uniquement               | NOT VERIFIED / NOT VERIFIED        |
| `20260602190000`                                                                                                             | Staging uniquement               | NOT VERIFIED / NOT VERIFIED        |
| `20260603100000`                                                                                                             | Staging uniquement               | NOT VERIFIED / NOT VERIFIED        |
| `20260603110000`                                                                                                             | Staging uniquement               | NOT VERIFIED / NOT VERIFIED        |
| `20260603113000`                                                                                                             | Staging uniquement               | NOT VERIFIED / NOT VERIFIED        |
| `20260603120000`                                                                                                             | Staging uniquement               | NOT VERIFIED / NOT VERIFIED        |
| `20260603130000`                                                                                                             | Staging uniquement               | NOT VERIFIED / NOT VERIFIED        |
| `20260603133000`                                                                                                             | Staging uniquement               | NOT VERIFIED / NOT VERIFIED        |
| `20260603134000`                                                                                                             | Staging uniquement               | NOT VERIFIED / NOT VERIFIED        |
| `20260828233000`                                                                                                             | Staging uniquement               | NOT VERIFIED / NOT VERIFIED        |

La tentative de découverte authentifiée via le MCP Supabase (`list_projects`) a échoué avec `Unauthorized`. Aucune CLI Supabase n’est disponible dans le PATH et `SUPABASE_ACCESS_TOKEN` n’est pas configuré dans le processus courant. La capture d’écran de la configuration locale MCP montre encore la valeur d’exemple `YOUR_SUPABASE_ACCESS_TOKEN`; le serveur n’est donc pas authentifié. Aucun secret n’a été recherché dans d’autres espaces ni affiché.

**Action nécessaire pour débloquer la suite :** dans la configuration locale du serveur Supabase MCP, remplacer la valeur du champ `SUPABASE_ACCESS_TOKEN` par un token valide, puis enregistrer et reconnecter le serveur. Ne pas copier ce token dans la conversation, le dépôt ou un fichier partagé. Après reconnexion, relancer la découverte des projets, puis consulter les migrations et tables des deux projets avant de tirer une conclusion. La comparaison des bases et la vérification des sauvegardes restent **BLOCKED** d’ici là.

**Recommandation de release : NO-GO via la chaîne actuelle**, car elle applique aussi les migrations. Réconcilier d’abord l’historique réel et les sauvegardes; une publication web seule exigerait un chemin explicitement approuvé, sans application implicite de SQL. Aucune des quinze migrations supplémentaires n’est approuvée pour promotion sur la seule base de cette comparaison Git.

## Validation locale

- `node --test scripts/vercel-config.test.mjs scripts/angular-web-build-config.test.mjs` — **5/5 réussis**.
- `git diff --check` — **réussi**.
- `pnpm.cmd test:workspace` — **28/28 réussis** lors du contrôle final.
- `pnpm.cmd -r --filter "./packages/**" build` puis `pnpm.cmd build:web` — **réussis** après correction du placement de l’option Angular 21. Le build a généré 13 routes statiques dans `apps/client/dist/web`, avec un total initial de 652,52 kB.
- Inspection des fichiers JavaScript sous `apps/client/dist/web/browser` — **réussie** : une référence à l’API production, aucune référence à l’API staging; `index.html` présent.
- Prettier sur les cinq fichiers modifiés — format appliqué avec le binaire local après un premier échec de résolution de la commande via `pnpm exec`.

Aucun scénario navigateur E2E ni envoi de formulaire vers l’API n’a été exécuté. Les paramètres authentifiés des projets Vercel/Render, les secrets disponibles et les règles d’approbation de l’environnement GitHub `production` n’ont pas été vérifiés. La présence de `environment: production` dans un workflow ne prouve pas à elle seule qu’une approbation humaine est requise.

## Conditions préalables à toute réconciliation ou retraite de staging

1. Désigner la branche canonique et examiner les changements de façon ciblée; ne pas fusionner la divergence globale.
2. Obtenir l’autorisation et des accès en lecture aux deux projets Supabase; comparer l’historique de migrations et les schémas, puis vérifier une sauvegarde et un exercice de restauration.
3. Choisir une seule voie approuvée pour les migrations de production et aligner les protections de branches/environnements avant de promouvoir le workflow staging.
4. Publier le build validé uniquement selon le processus de release approuvé, puis vérifier la CSP, le bundle, les parcours critiques, l’API et les dépendances en production.
5. Confirmer l’hébergement web réellement voulu (Vercel ou un service Render valide) et ses URLs avant tout changement de routage ou de service.
6. Ne retirer staging qu’après validation documentée de la base, des données, des secrets, des intégrations, des sauvegardes, de la restauration et du comportement applicatif.

**Conclusion :** la production observée est partiellement disponible, mais la réconciliation des branches et des bases, la correction CSP en ligne, la voie d’hébergement web attendue et la préservation des données restent non validées. Aucun retrait de staging n’est recommandé à ce stade.
