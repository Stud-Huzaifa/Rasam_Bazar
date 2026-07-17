import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { PrismaService } from '../prisma.service';
import { ProposalsController } from './proposals.controller';
import { ProposalsService } from './proposals.service';

@Module({
  imports: [BookingsModule],
  controllers: [ProposalsController],
  providers: [ProposalsService, PrismaService],
})
export class ProposalsModule {}
