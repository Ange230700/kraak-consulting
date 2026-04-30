import process from 'node:process';

const DEFAULT_TIMEOUT_MS = 10_000;

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

export function normalizePublicUrl(value, name) {
  if (!value || value.trim().length === 0) {
    throw new Error(`La variable ${name} est requise pour executer les checks d observabilite.`);
  }

  return trimTrailingSlash(value.trim());
}

export function createObservabilityTargets({ webUrl, apiUrl }) {
  const normalizedWebUrl = normalizePublicUrl(webUrl, 'KRAAK_OBSERVABILITY_WEB_URL');
  const normalizedApiUrl = normalizePublicUrl(apiUrl, 'KRAAK_OBSERVABILITY_API_URL');

  return [
    {
      name: 'web-home',
      url: `${normalizedWebUrl}/`,
      expectedStatus: 200,
      expectedContentType: 'text/html',
    },
    {
      name: 'api-health',
      url: `${normalizedApiUrl}/health`,
      expectedStatus: 200,
      expectedContentType: 'application/json',
    },
  ];
}

export async function checkTarget(target, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(target.url, {
    headers: {
      Accept:
        target.expectedContentType === 'application/json'
          ? 'application/json'
          : 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  const contentType = response.headers.get('content-type') ?? '';
  const result = {
    name: target.name,
    url: target.url,
    ok: response.ok && response.status === target.expectedStatus,
    status: response.status,
    contentType,
  };

  if (!contentType.toLowerCase().includes(target.expectedContentType)) {
    throw new Error(
      `${target.name} a retourne le content-type \"${contentType || 'inconnu'}\" au lieu de \"${target.expectedContentType}\".`,
    );
  }

  if (!result.ok) {
    throw new Error(
      `${target.name} a retourne le statut HTTP ${response.status} au lieu de ${target.expectedStatus}.`,
    );
  }

  if (target.name === 'api-health') {
    const payload = await response.json();

    if (payload.status !== 'ok' || payload.service !== 'kraak-api') {
      throw new Error(
        'api-health a retourne un payload invalide: status=ok et service=kraak-api sont requis.',
      );
    }

    result.payload = payload;
  }

  return result;
}

export async function runObservabilityChecks(input, options = {}) {
  const targets = createObservabilityTargets(input);
  const results = [];

  for (const target of targets) {
    results.push(await checkTarget(target, options));
  }

  return results;
}

function formatSummary(results) {
  return results
    .map((result) => {
      const details = [`${result.name}: ${result.status}`, result.url];

      if (result.name === 'api-health' && result.payload) {
        details.push(`env=${result.payload.environment}`);
        details.push(`version=${result.payload.version}`);
      }

      return `- ${details.join(' | ')}`;
    })
    .join('\n');
}

async function main() {
  const webUrl = process.env['KRAAK_OBSERVABILITY_WEB_URL'];
  const apiUrl = process.env['KRAAK_OBSERVABILITY_API_URL'];
  const results = await runObservabilityChecks({ webUrl, apiUrl });

  console.log('Checks d observabilite passes avec succes:');
  console.log(formatSummary(results));
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}