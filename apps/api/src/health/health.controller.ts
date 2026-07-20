import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma.service';

const version = process.env.npm_package_version || '1.0.0';

function healthPayload(
  status: 'healthy' | 'unhealthy',
  database: 'connected' | 'unavailable',
  startedAt: number,
) {
  return {
    status,
    database,
    version,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    latencyMs: Date.now() - startedAt,
  };
}

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async getHealth() {
    const startedAt = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException(
        healthPayload('unhealthy', 'unavailable', startedAt),
      );
    }

    return healthPayload('healthy', 'connected', startedAt);
  }
}
