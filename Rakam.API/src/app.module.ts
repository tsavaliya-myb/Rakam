import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validate } from './config/validation';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { HealthController } from './app.controller';

import { AuthModule } from './modules/auth/auth.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { UsersModule } from './modules/users/users.module';
import { FirmsModule } from './modules/firms/firms.module';
import { PartiesModule } from './modules/parties/parties.module';
import { ProductsModule } from './modules/products/products.module';
import { SalesBillsModule } from './modules/sales-bills/sales-bills.module';
import { PurchaseBillsModule } from './modules/purchase-bills/purchase-bills.module';
import { DeliveryChallansModule } from './modules/delivery-challans/delivery-challans.module';
import { EwayBillsModule } from './modules/eway-bills/eway-bills.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { PdfModule } from './modules/pdf/pdf.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    RedisModule,
    QueueModule,
    AuthModule,
    AccountsModule,
    UsersModule,
    FirmsModule,
    PartiesModule,
    ProductsModule,
    SalesBillsModule,
    PurchaseBillsModule,
    DeliveryChallansModule,
    EwayBillsModule,
    ExpensesModule,
    TransactionsModule,
    ReportsModule,
    SettingsModule,
    SubscriptionsModule,
    DashboardModule,
    AttachmentsModule,
    PdfModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
