import { IsIn, IsOptional, IsString } from 'class-validator';

export class RetryOtpDto {
  @IsString()
  reqId!: string;

  @IsOptional()
  @IsIn(['text', 'voice'])
  retryType?: 'text' | 'voice';
}
