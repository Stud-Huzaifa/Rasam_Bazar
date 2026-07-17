import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';

@Module({
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService, PrismaService],
})
export class ServiceRequestsModule {}
