import { Injectable, Optional } from '@nestjs/common';

function readNonEmptyEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function resolveDeploymentEnvironment(): string {
  return (
    readNonEmptyEnv('APP_ENV') ?? readNonEmptyEnv('NODE_ENV') ?? 'development'
  );
}

export interface HealthStatus {
  status: 'ok';
  service: string;
  environment: string;
  timestamp: string;
  version: string;
  uptimeSeconds: number;
}

@Injectable()
export class AppService {
  constructor(
    @Optional() private readonly getNow: () => Date = () => new Date(),
    @Optional()
    private readonly getUptimeSeconds: () => number = () =>
      Math.floor(process.uptime()),
    @Optional()
    private readonly environment = resolveDeploymentEnvironment(),
    @Optional()
    private readonly version = process.env['APP_VERSION'] ??
      process.env['npm_package_version'] ??
      '0.0.0',
  ) {}

  getHealth(): HealthStatus {
    return {
      status: 'ok',
      service: 'kraak-api',
      environment: this.environment,
      timestamp: this.getNow().toISOString(),
      version: this.version,
      uptimeSeconds: this.getUptimeSeconds(),
    };
  }
}
