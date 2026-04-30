import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService, HealthStatus } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: "Vérifier l'état de l'API" })
  @ApiResponse({
    status: 200,
    description: "L'API fonctionne correctement",
    schema: {
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'kraak-api' },
        environment: { type: 'string', example: 'production' },
        timestamp: { type: 'string', format: 'date-time' },
        version: { type: 'string', example: '0.0.0' },
        uptimeSeconds: { type: 'number', example: 42 },
      },
    },
  })
  getHealth(): HealthStatus {
    return this.appService.getHealth();
  }
}
