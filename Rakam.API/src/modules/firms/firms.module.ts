import { Module } from '@nestjs/common';
import { FirmsController } from './firms.controller';
import { FirmsService } from './firms.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [FirmsController],
  providers: [FirmsService],
  exports: [FirmsService],
})
export class FirmsModule {}
