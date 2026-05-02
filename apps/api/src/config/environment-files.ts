export function resolveApiEnvFilePaths(nodeEnv: string | undefined): string[] {
  const normalizedEnvironment = nodeEnv?.trim().toLowerCase() || 'local';

  if (normalizedEnvironment === 'local') {
    return ['.env'];
  }

  return [`.env.${normalizedEnvironment}`, '.env'];
}
