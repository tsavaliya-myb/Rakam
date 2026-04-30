import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Msg91Service } from './msg91.service';
import { AuthKeys } from '../../common/cache-keys';

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;
  private readonly refreshTtlSeconds: number;

  constructor(
    private readonly msg91: Msg91Service,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    this.refreshSecret = config.get<string>('jwt.refreshSecret')!;
    this.refreshTtlSeconds = this.parseTtl(config.get<string>('jwt.refreshTtl') ?? '30d');
  }

  async sendOtp(mobile: string): Promise<{ reqId: string }> {
    const reqId = await this.msg91.sendOtp(mobile);
    return { reqId };
  }

  async retryOtp(reqId: string, retryType: 'text' | 'voice' = 'text'): Promise<void> {
    await this.msg91.retryOtp(reqId, retryType);
  }

  async verifyOtp(reqId: string, otp: string) {
    const msg91Token = await this.msg91.verifyOtp(reqId, otp);
    const mobile = await this.msg91.verifyAccessToken(msg91Token);

    let isNewUser = false;

    const user = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { mobile } });
      if (existing) {
        await tx.user.update({ where: { id: existing.id }, data: { lastLoginAt: new Date() } });
        return existing;
      }
      isNewUser = true;
      const account = await tx.account.create({ data: {} });
      const now = new Date();
      await tx.subscription.create({
        data: {
          accountId: account.id,
          planType: 'TRIAL',
          planName: 'Trial Plan',
          startsAt: now,
          expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          firmLimit: 1,
          isActive: true,
        },
      });
      return tx.user.create({ data: { mobile, accountId: account.id, lastLoginAt: new Date() } });
    });

    const tokens = await this.issueTokenPair(user.id, user.accountId, mobile);
    return { ...tokens, isNewUser };
  }

  async refresh(rawRefreshToken: string) {
    let payload: { sub: string; accountId: string; mobile: string; jti: string };
    try {
      payload = this.jwt.verify(rawRefreshToken, { secret: this.refreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const key = AuthKeys.refreshToken(BigInt(payload.sub), payload.jti);
    const exists = await this.redis.get<boolean>(key);
    if (!exists) throw new UnauthorizedException('Refresh token revoked');

    await this.redis.del(key);
    return this.issueTokenPair(BigInt(payload.sub), BigInt(payload.accountId), payload.mobile);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    try {
      const payload = this.jwt.verify<{ sub: string; jti: string }>(rawRefreshToken, {
        secret: this.refreshSecret,
      });
      await this.redis.del(AuthKeys.refreshToken(BigInt(payload.sub), payload.jti));
    } catch {
      // already expired or invalid — treat as logged out
    }
  }

  private async issueTokenPair(userId: bigint, accountId: bigint, mobile: string) {
    const jti = crypto.randomUUID();
    const base = { sub: userId.toString(), accountId: accountId.toString(), mobile };

    const accessToken = this.jwt.sign(base);
    const refreshToken = this.jwt.sign(
      { ...base, jti },
      { secret: this.refreshSecret, expiresIn: this.refreshTtlSeconds },
    );

    await this.redis.set(AuthKeys.refreshToken(userId, jti), true, this.refreshTtlSeconds);

    return { accessToken, refreshToken };
  }

  private parseTtl(ttl: string): number {
    const m = ttl.match(/^(\d+)([smhd])$/);
    if (!m) return 60 * 60 * 24 * 30;
    const multiplier: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return parseInt(m[1]) * multiplier[m[2]];
  }
}
