import { Module } from '@nestjs/common';
import { ProfileController, SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  controllers: [ProfileController, SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
