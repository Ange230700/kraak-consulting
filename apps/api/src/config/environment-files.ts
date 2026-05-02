const envFileAliases: Record<string, string> = {
  production: 'prod',
};

export function resolveApiEnvFilePaths(nodeEnv: string | undefined): string[] {
  const normalizedEnvironment = nodeEnv?.trim().toLowerCase() || 'local';

  if (normalizedEnvironment === 'local') {
    return ['.env'];
  }

  const envFileEnvironment =
    envFileAliases[normalizedEnvironment] ?? normalizedEnvironment;

  return [`.env.${envFileEnvironment}`, '.env'];
}
