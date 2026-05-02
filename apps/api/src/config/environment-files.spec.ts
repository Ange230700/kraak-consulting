import { resolveApiEnvFilePaths } from './environment-files';

describe('resolveApiEnvFilePaths', () => {
  it('Given NODE_ENV is missing, When env files are resolved, Then only the local .env is loaded', () => {
    expect(resolveApiEnvFilePaths(undefined)).toEqual(['.env']);
  });

  it('Given NODE_ENV is local, When env files are resolved, Then only the local .env is loaded', () => {
    expect(resolveApiEnvFilePaths('local')).toEqual(['.env']);
  });

  it('Given NODE_ENV is development, When env files are resolved, Then .env.development is loaded before the local fallback', () => {
    expect(resolveApiEnvFilePaths('development')).toEqual([
      '.env.development',
      '.env',
    ]);
  });

  it('Given NODE_ENV is staging, When env files are resolved, Then .env.staging is loaded before the local fallback', () => {
    expect(resolveApiEnvFilePaths('staging')).toEqual(['.env.staging', '.env']);
  });

  it('Given NODE_ENV is production, When env files are resolved, Then .env.prod is loaded before the local fallback', () => {
    expect(resolveApiEnvFilePaths('production')).toEqual(['.env.prod', '.env']);
  });

  it('Given NODE_ENV is prod, When env files are resolved, Then .env.prod is loaded before the local fallback', () => {
    expect(resolveApiEnvFilePaths('prod')).toEqual(['.env.prod', '.env']);
  });
});
