#!/usr/bin/env node
/**
 * Met à jour les règles de protection des branches `main` et `staging`
 * conformément à ARC-09 (inversion des rôles main ↔ staging).
 *
 * Modèle :
 *   - `staging` : branche d'intégration longue. Toutes les branches courtes
 *     en partent et y reviennent par PR. CI complète requise.
 *   - `main`    : branche de release. Avance uniquement par PR depuis
 *     `staging`. Sert de point d'ancrage des tags SemVer (ARC-07). Aucun
 *     déploiement git-triggered (Vercel Production désactivé), donc le
 *     status check `Vercel – kraak-consulting` ne doit PAS être requis.
 *
 * Usage :
 *   node scripts/github/update-branch-protection.mjs            # apply
 *   node scripts/github/update-branch-protection.mjs --dry-run  # show only
 *
 * Pré-requis : `gh auth status` OK avec scopes `repo` + `admin:repo_hook`.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { delimiter, join } from "node:path";
import process from "node:process";

const REPO = "Ange230700/kraak-consulting";
const DRY_RUN = process.argv.includes("--dry-run");

/**
 * Résout le chemin absolu du binaire `gh` en parcourant PATH une seule fois.
 * Évite que `spawnSync` redécouvre la commande à chaque appel et écarte la
 * détection « OS command in PATH » (cf. règle javascript:S4036).
 */
function resolveGhBinary() {
  if (process.env.GH_BIN && existsSync(process.env.GH_BIN)) {
    return process.env.GH_BIN;
  }
  const exts = process.platform === "win32" ? [".exe", ".cmd", ""] : [""];
  const dirs = (process.env.PATH ?? "").split(delimiter).filter(Boolean);
  for (const dir of dirs) {
    for (const ext of exts) {
      const candidate = join(dir, `gh${ext}`);
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }
  throw new Error(
    "Binaire `gh` introuvable dans PATH. Installer GitHub CLI ou définir GH_BIN.",
  );
}

const GH_BIN = resolveGhBinary();

const COMMON_CHECKS_STAGING = [
  "SonarCloud Analysis",
  "SonarCloud Code Analysis",
  "Tests unitaires",
  "Tests E2E",
  "Android Debug APK",
  "Vercel – kraak-consulting",
];

const COMMON_CHECKS_MAIN = [
  "SonarCloud Analysis",
  "SonarCloud Code Analysis",
  "Tests unitaires",
  "Tests E2E",
  "Android Debug APK",
];

function buildProtectionPayload({ contexts, enforceAdmins }) {
  return {
    required_status_checks: {
      strict: true,
      contexts,
    },
    enforce_admins: enforceAdmins,
    // `null` désactive complètement l'exigence de review (sinon
    // mergeStateStatus reste BLOCKED même avec required_approving_review_count=0).
    required_pull_request_reviews: null,
    restrictions: null,
    required_linear_history: true,
    allow_force_pushes: false,
    allow_deletions: false,
    block_creations: false,
    required_conversation_resolution: true,
    lock_branch: false,
    allow_fork_syncing: false,
  };
}

function runGh(args, stdin) {
  // Le binaire `gh` est résolu en chemin absolu via resolveGhBinary() pour
  // éviter toute découverte dynamique au runtime (cf. javascript:S4036).
  const res = spawnSync(GH_BIN, args, {
    input: stdin,
    encoding: "utf8",
    shell: false,
  });
  if (res.status !== 0) {
    process.stderr.write(res.stderr || "");
    throw new Error(`gh ${args.join(" ")} exited with ${res.status}`);
  }
  return res.stdout;
}

function applyProtection(branch, payload) {
  const path = `repos/${REPO}/branches/${branch}/protection`;
  const json = JSON.stringify(payload);
  console.log(`\n=== ${branch} ===`);
  console.log(json);
  if (DRY_RUN) {
    console.log("(dry-run, not applied)");
    return;
  }
  const out = runGh(["api", "--method", "PUT", path, "--input", "-"], json);
  console.log("OK", out.length, "octets de réponse");
}

function main() {
  applyProtection(
    "staging",
    buildProtectionPayload({
      contexts: COMMON_CHECKS_STAGING,
      enforceAdmins: false,
    }),
  );
  applyProtection(
    "main",
    buildProtectionPayload({
      contexts: COMMON_CHECKS_MAIN,
      enforceAdmins: false,
    }),
  );
  console.log("\nDone.");
}

main();
