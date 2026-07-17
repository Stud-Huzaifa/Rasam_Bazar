import { Module } from '@nestjs/common';
import { WeddingsController } from './weddings.controller';
import { WeddingsService } from './weddings.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [WeddingsController],
  providers: [WeddingsService, PrismaService],
})
export class WeddingsModule {}
