import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService, HealthStatus } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  private normalizeNonEmptyString(value: string, fallback: string): string {
    return value.trim().length > 0 ? value : fallback;
  }

  private normalizeUptimeSeconds(value: number): number {
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }

  private normalizeTimestamp(value: string): string {
    const parsedDate = Date.parse(value);
    return Number.isNaN(parsedDate) ? new Date(0).toISOString() : value;
  }

  @Get('health')
  @ApiOperation({ summary: "Vérifier l'état de l'API" })
  @ApiResponse({
    status: 200,
    description: "L'API fonctionne correctement",
    schema: {
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'kraak-api' },
        environment: {
          type: 'string',
          enum: ['local', 'staging', 'production'],
          example: 'production',
        },
        timestamp: { type: 'string', format: 'date-time' },
        version: { type: 'string', example: '0.0.0' },
        uptimeSeconds: { type: 'number', example: 42 },
      },
    },
  })
  getHealth(): HealthStatus {
    const health = this.appService.getHealth();

    return {
      status: 'ok',
      service: this.normalizeNonEmptyString(health.service, 'kraak-api'),
      environment: this.normalizeNonEmptyString(
        health.environment,
        'development',
      ),
      timestamp: this.normalizeTimestamp(health.timestamp),
      version: this.normalizeNonEmptyString(health.version, '0.0.0'),
      uptimeSeconds: this.normalizeUptimeSeconds(health.uptimeSeconds),
    };
  }
}
