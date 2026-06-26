import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DonorsModule } from './modules/donors/donors.module';
import { EligibilityModule } from './modules/eligibility/eligibility.module';
import { ScreeningModule } from './modules/screening/screening.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { FefoModule } from './modules/fefo/fefo.module';
import { RequestsModule } from './modules/requests/requests.module';
import { DistributionModule } from './modules/distribution/distribution.module';
import { CrossPmiModule } from './modules/cross-pmi/cross-pmi.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { SmartCallingModule } from './modules/smart-calling/smart-calling.module';
import { ExpiredModule } from './modules/expired/expired.module';
import { ForecastingModule } from './modules/forecasting/forecasting.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DonationsModule } from './modules/donations/donations.module';
import { DashboardGateway } from './websocket/dashboard.gateway';
import { NotificationGateway } from './websocket/notification.gateway';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    DonorsModule,
    EligibilityModule,
    ScreeningModule,
    InventoryModule,
    FefoModule,
    RequestsModule,
    DistributionModule,
    CrossPmiModule,
    AlertsModule,
    SmartCallingModule,
    ExpiredModule,
    ForecastingModule,
    DashboardModule,
    DonationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, DashboardGateway, NotificationGateway],
})
export class AppModule {}
