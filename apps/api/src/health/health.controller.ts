import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma.service';

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
      throw new ServiceUnavailableException({
        status: 'unhealthy',
        database: 'unavailable',
        version: '1.0.0',
        uptimeSeconds: Math.round(process.uptime()),
        latencyMs: Date.now() - startedAt,
      });
    }

    return {
      status: 'healthy',
      database: 'connected',
      version: '1.0.0',
      uptimeSeconds: Math.round(process.uptime()),
      latencyMs: Date.now() - startedAt,
    };
  }
}
