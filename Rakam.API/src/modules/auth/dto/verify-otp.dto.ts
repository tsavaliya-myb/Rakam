import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  mobile!: string;

  @IsString()
  @Length(4, 6)
  otp!: string;
}
