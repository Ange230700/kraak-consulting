import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

type CorsEnv = {
  CORS_ALLOWED_ORIGINS?: string;
  CORS_ALLOWED_ORIGIN_PATTERNS?: string;
};

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function compilePatterns(value: string | undefined): RegExp[] {
  return parseList(value).map((pattern) => {
    try {
      return new RegExp(pattern);
    } catch {
      throw new Error(
        `CORS_ALLOWED_ORIGIN_PATTERNS contient une expression régulière invalide : "${pattern}"`,
      );
    }
  });
}

/**
 * Construit la configuration CORS de l'API en combinant :
 *   - une liste d'origines exactes (`CORS_ALLOWED_ORIGINS`),
 *   - une liste d'expressions régulières (`CORS_ALLOWED_ORIGIN_PATTERNS`)
 *     utilisée notamment pour autoriser les déploiements de prévisualisation
 *     Vercel dont l'URL change à chaque commit.
 *
 * Si aucune variable n'est définie, la politique reste permissive
 * (utile en local et pour les outils côté serveur).
 */
export function buildCorsOptions(env: CorsEnv): CorsOptions {
  const exactOrigins = parseList(env.CORS_ALLOWED_ORIGINS);
  const patterns = compilePatterns(env.CORS_ALLOWED_ORIGIN_PATTERNS);

  if (exactOrigins.length === 0 && patterns.length === 0) {
    return { credentials: true, origin: true };
  }

  const allowedSet = new Set(exactOrigins);

  return {
    credentials: true,
    origin: (origin, callback) => {
      // Pas d'en-tête Origin (ex. requêtes serveur-à-serveur, curl, healthchecks)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedSet.has(origin)) {
        callback(null, true);
        return;
      }

      if (patterns.some((pattern) => pattern.test(origin))) {
        callback(null, true);
        return;
      }

      callback(
        new Error(`Origine non autorisée par la politique CORS : ${origin}`),
        false,
      );
    },
  };
}
