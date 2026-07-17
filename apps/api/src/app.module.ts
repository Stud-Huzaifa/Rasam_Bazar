import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { WeddingsModule } from './weddings/weddings.module';
import { VendorsModule } from './vendors/vendors.module';
import { GuestsModule } from './guests/guests.module';
import { BudgetModule } from './budget/budget.module';
import { TasksModule } from './tasks/tasks.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { ProposalsModule } from './proposals/proposals.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    AuthModule,
    WeddingsModule,
    VendorsModule,
    GuestsModule,
    BudgetModule,
    TasksModule,
    ServiceRequestsModule,
    ProposalsModule,
    BookingsModule,
    ReviewsModule,
    NotificationsModule,
    AdminModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
