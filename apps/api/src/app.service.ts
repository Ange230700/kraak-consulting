import { Injectable } from '@nestjs/common';

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
    private readonly getNow: () => Date = () => new Date(),
    private readonly getUptimeSeconds: () => number = () =>
      Math.floor(process.uptime()),
    private readonly environment = process.env['NODE_ENV'] ?? 'development',
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
