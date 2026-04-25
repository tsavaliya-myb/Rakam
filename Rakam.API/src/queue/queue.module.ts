import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { QUEUES } from '../common/constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password'),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUES.PDF },
      { name: QUEUES.EXCEL },
      { name: QUEUES.EWAY },
      { name: QUEUES.NOTIFY },
      { name: QUEUES.EMAIL },
      { name: QUEUES.REPORTS },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
