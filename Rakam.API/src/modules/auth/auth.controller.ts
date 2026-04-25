import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // TODO: POST /auth/otp/request   → send MSG91 OTP
  // TODO: POST /auth/otp/verify    → exchange OTP → access + refresh
  // TODO: POST /auth/refresh       → rotate refresh token
  // TODO: POST /auth/logout        → revoke refresh token
  // TODO: GET  /auth/me            → current user + account
}
